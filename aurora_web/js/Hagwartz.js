var database = [[]];

/**Replace all instances of a string within a string */
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

/**Save an object to localStorage through JSON */
Storage.prototype.setObj = function (key, obj) {
	//console.debug("Writing to localStorage : " + key);
	return this.setItem(key, JSON.stringify(obj))
}


/**Get an object from localStorage through JSON */
Storage.prototype.getObj = function (key) {
	//console.debug("Reading from localStorage : " + key);
	return JSON.parse(this.getItem(key))
}


/**Save CSV of courses to Local Storage
 * This should only be called onClick of login page
 * (basically resets local storage)
 */
function saveCSVToLocalStorage(csv) {

	/**
	 * "a,b,c,#d,e#$,f,g,h,#i,j"
	 * Tokenize on each , unless within ## block
	 * Tokenize on each $ <-- Represents newline
	 * 
	 * First line is headers to be used as localStorage keys
	 * 
	 * Let's start each array[0] be the title of the array (for key par)
	 */

	let withinBlock = false;
	let arrIndexer = 0;
	let subStart = 0;
	let i = 0;
	//Let us rebuild the spreadsheet into a 2D array
	for (i = 0; i < csv.length; i++) {
		if (csv[i] == ',' && !withinBlock) {
			if (arrIndexer + 1 > database.length) {
				//Add another column to the database
				database.push([]);
			}
			//Put the substring into the current row
			database[arrIndexer++].push(csv.substring(subStart, i));
			//set substring pointer to current
			subStart = i + 1;
		} else if (csv[i] == '#') {
			if (!withinBlock) {
				//skip the pointer over the first #
				subStart = i + 1;
			} else {
				//slice out the last #
				csv = csv.slice(0, i) + csv.slice(i + 1, csv.length);
				//fix the off by 1 error
				i--;
			}
			withinBlock = !withinBlock;
		} else if (csv[i] == "$") {
			if (arrIndexer + 1 > database.length) {
				//Add another column to the database
				database.push([]);
			}
			database[arrIndexer++].push(csv.substring(subStart, i));
			//Hit the newline, reset counters
			arrIndexer = 0;
			subStart = i + 1;
		}
	}

	//Now we store the array in localStorage
	for (i = 0; i < database.length; i++) {
		//The 0th elemennt is the key, the entire array is the value
		localStorage.setObj(database[i][0], database[i]);
	}
}

/**Toggles the courseID's planned state */
function togglePlanned(courseID) {
	let plannedList = localStorage.getObj("isPlanned");
	let regList = localStorage.getObj("isRegistered");
	console.assert(courseID != 0, "Called togglePlanned(" + courseID + ") the first element of localStorage is a key, not an element");
	//Cannot change the course if it is registered (courses must be planned before they may be registered)
	if (regList[courseID] == "No") {
		if (plannedList[courseID] == "No") {
			plannedList[courseID] = "Yes";
		} else {
			plannedList[courseID] = "No";
		}
		localStorage.setObj(plannedList[0], plannedList)
	}
}

/**Toggles the courseID's compared state */
function toggleCompared(courseID) {
	let compareList = localStorage.getObj("isCompare");
	console.assert(courseID != 0, "Called toggleCompared(" + courseID + ") the first element of localStorage is a key, not an element");
	if (compareList[courseID] == "No") {
		compareList[courseID] = "Yes";
	} else {
		compareList[courseID] = "No";
	}
	localStorage.setObj(compareList[0], compareList)
}

/**Toggles a host of buttons */
function toggleButton(button) {
	switch (button.innerHTML) {
		case "Add to Compare":
			toggleCompared(button.id);
			button.innerHTML = "Remove from Compare";
			break;
		case "Remove from Compare":
			toggleCompared(button.id);
			button.innerHTML = "Add to Compare";
			break;
		case "Add to Planner":
			togglePlanned(button.id);
			button.innerHTML = "Remove from Planner";
			break;
		case "Remove from Planner":
			//If a course is currently registered you cannot remove it from the planner
			if(localStorage.getObj("isRegistered")[button.id].indexOf("Yes") > -1)
				break;
			togglePlanned(button.id);
			button.innerHTML = "Add to Planner";
			break;
		default:
			text = "Broken Button";
			console.error("Function toggleButton reached improper state");
	}
}

/**Gets the details for a specific course and returns the standard view for it*/
function getCourseDetails(id) {

	let dept = localStorage.getObj("Departments");
	let courseNum = localStorage.getObj("CourseNumbers");
	let shortName = localStorage.getObj("ShortNames");
	let textbooks = localStorage.getObj("RequiredTextbooks")[id];
	let description = localStorage.getObj("CourseDescriptions")[id];
	let preRequisites = localStorage.getObj("Pre-Requisites")[id];
	let isCompare = localStorage.getObj("isCompare")[id];
	let isPlanned = localStorage.getObj("isPlanned")[id];

	//Fix up the textbooks so they render nicely
	let textbook = textbooks.replace(/, By/g, "<br>&emsp;By").replace(/,/g, "<br>");
	//Grab PreReqs and convert the IDs to readable names with links (change details pane)
	//We may have a list of size 0+
	let preReqs = "None"
	if (preRequisites != "") {
		preReqs = "";
		preRequisites = preRequisites.split(", ");
		for (i = 0; i < preRequisites.length; i++) {
			//This will cause issues when there is more than one details pane..
			preReqs += `<a href="javascript:updateSearchResultDetails(${preRequisites[i]})">${dept[preRequisites[i]]} ${courseNum[preRequisites[i]]} : ${shortName[preRequisites[i]]}</a><br>`;
		}

	}

	let compareBtn = "";
	if (isCompare == "No") {
		compareBtn = "Add to Compare";
	} else {
		compareBtn = "Remove from Compare";
	}

	let plannerBtn = "";
	if (isPlanned == "No") {
		plannerBtn = "Add to Planner";
	} else {
		plannerBtn = "Remove from Planner";
	}

	return `
			<div id="course_name"><h3>
				${dept[id]} ${courseNum[id]} : ${shortName[id]}</h3></div>
			<b>Description:</b><br>
			<div id="description">
				${description}</div>
			<b>Textbooks:</b><br>
			<div id="textbooks">
				${textbook}</div>
			<b>Course Prerequisites:</b><br>
			<div id="prerequisites">
				<a action="onclick(\'updateSearchResultDetails(${preRequisites[i]})\'">${preReqs}</a></div>
			<!-- Still have not found a way to shove these items to the bottom of the div-->
			<div class="btn-group btn-group-lg d-flex align-bottom" role="group" aria-label="...">
				<button type="button" class="btn btn-outline-secondary btn-lg flex-fill" id="${id}" onclick="toggleButton(this)">${plannerBtn}</button>
				<button type="button" class="btn btn-outline-secondary btn-lg flex-fill" id="${id}" onclick="toggleButton(this)">${compareBtn}</button>
			</div>`;
}

