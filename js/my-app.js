// Initialize your app
var mobilediary = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = mobilediary.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

$(document).ready(function(){
    document.addEventListener('deviceready', onDeviceReady, false);
});

function onDeviceReady(){
    // Display quick note
getQuickNote();

mobilediary.onPageInit('index', function (page) {
   	getQuickNote();
});

var request = indexedDB.open("mobilediary1", 1);

request.onupgradeneeded = function(event){
	var db = event.target.result;

	//Subjects table
	if(!db.objectStoreNames.contains("subjects")){
		var os = db.createObjectStore("subjects", {keyPath: 'id', autoIncrement:true});

		os.createIndex("title", "title", {unique:false});
	}

	//Entries table
	if(!db.objectStoreNames.contains("entries")){
		var os = db.createObjectStore("entries", {keyPath: 'id', autoIncrement:true});

		os.createIndex("title", "title", {unique:false});
		os.createIndex("subject", "subject", {unique:false});
		os.createIndex("date", "date", {unique:false});
		os.createIndex("body", "body", {unique:false});
	}
}

request.onsuccess = function(event){
	console.log('Success: Database opened');
	db = event.target.result;

	//Get all subjects
	getSubjects();

	mobilediary.onPageInit('index', function (page) {
   		getSubjects();
	});

	mobilediary.onPageInit('new-entry', function (page) {
   		getSubjectList();
	});

	mobilediary.onPageInit('new-entry', function (page) {
   		// Get Formatted Current Date
   		Date.prototype.toDateInputValue = (function() {
	        var local = new Date(this);
	        local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
	        return local.toJSON().slice(0,10);
	    });

	   // Display Current Date in Date Field
	   $('#datePicker').val(new Date().toDateInputValue());
	});

}

request.onerror = function(event){
	console.log('Error: Database not opened');
}
}



function addSubject(){
	var title=$('#title').val();

	var transaction = db.transaction(["subjects"],"readwrite");

	var store = transaction.objectStore("subjects");

	//Define Store
	var subject = {
		title: title
	};

	// Perform the add
	var request = store.add(subject);

	//Success
	request.onsuccess = function(event){
		console.log('Subject added: ' + subject)
	}

	//Faile
	request.onerror = function(event){
		console.log('There was an error');
	}
}

function getSubjects(){
	var transaction = db.transaction(["subjects"],"readonly");
	var store = transaction.objectStore("subjects");
	var index = store.index("title");

	var output = '';

	index.openCursor().onsuccess = function(event){
		var cursor = event.target.result;
		if (cursor){
			output += '<li><a onclick="getEntries('+cursor.value.id+')" href="entries.html" class="item-link">' +
                      '<div class="item-content">' +
                      '<div class="item-inner"> ' +
                      '<div class="item-title">'+cursor.value.title+'</div>' +
                      '</div>' +
                      '</div></a></li>';
            cursor.continue();
		}
		$('#subjectList').html(output);
	}
}

// Get List of Subjects For Entry Form
function getSubjectList(current){
	var transaction = db.transaction(["subjects"],"readonly");
	var store = transaction.objectStore("subjects");
	var index = store.index("title");
	
	var output = '';
	index.openCursor().onsuccess = function(event) {
		var cursor = event.target.result;
		if(cursor) {	
			if(cursor.value.id == current){
				output += '<option value="'+cursor.value.id+'" selected>'+cursor.value.title+'</option>';
			} else {
            	output += '<option value="'+cursor.value.id+'">'+cursor.value.title+'</option>';
        	}
			cursor.continue();
		}
		$("#subjectSelect").html(output);
	}
}

// Add an entry 
function addEntry(){
	var title = $('#title').val();
	var subject = $('#subjectSelect').val();
	var date = $('#datePicker').val();
	var body = $('#body').val();

	var transaction = db.transaction(["entries"],"readwrite");

	var store = transaction.objectStore("entries");

	//Define Store
	var entry = {
		title: title,
		subject: subject,
		date: date,
		body: body 
	};

	// Perform the add
	var request = store.add(entry);

	//Success
	request.onsuccess = function(event){
		console.log('Entry added: ' + entry)
	}

	//Faile
	request.onerror = function(event){
		console.log('There was an error');
	}
}

// Get and display entries
function getEntries(subjectId){
	mobilediary.onPageInit('entries', function (page) {
		getSubjectTitle(subjectId);
	   	var transaction = db.transaction(["entries"],"readonly");
		var store = transaction.objectStore("entries");
		var index = store.index("title");

		var output = '';
		index.openCursor().onsuccess = function(event){
			var cursor = event.target.result;
			if (cursor){
				console.log('Checking: ' + cursor.value.subject);
				if(cursor.value.subject == subjectId) {
					output += '<li><a onclick="getEntry('+cursor.value.id+')" href="entry.html" class="item-link">' +
		                      '<div class="item-content">' +
		                      '<div class="item-inner"> ' +
		                      '<div class="item-title">'+cursor.value.title+'</div>' +
		                      '</div>' +
		                      '</div></a></li>';
		            
		        }
		        cursor.continue();
			}
			$('#entryList').html(output);
		}
	});
}

// Get the SubjectTitle
function getSubjectTitle(id){
	var transaction = db.transaction(["subjects"],"readonly");
	var store = transaction.objectStore("subjects");
	var request = store.get(id);

	request.onsuccess = function(event){
		var subjectTitle = request.result.title;
		$('#subjectTitle').html(subjectTitle);
	}
}

//get a single entry
function getEntry(entryId){
	mobilediary.onPageInit('entry', function (page) {
   		var transaction = db.transaction(["entries"],"readonly");
		var store = transaction.objectStore("entries");
		var request = store.get(entryId);

		request.onsuccess = function(event){
			$('#editForm').attr('onsubmit','editEntry('+entryId+')');
			$('#entryTitle').html(request.result.title);
			$('#entryDate').html(request.result.date);
			$('#entryBody').html(request.result.body);

			// Edit Form Fields
		  	getSubjectList(request.result.subject);
		  	$('#title').attr('value', request.result.title);
		  	$('#datePicker').attr('value', request.result.date);
		  	$('#body').html(request.result.body);

			$('#editBtn').html('<a href="#" onclick="showEditForm()" class="button button-small button-fill color-blue">Edit</a>');
			$('#deleteBtn').html('<a href="#" onclick="removeEntry(' + entryId + ')" class="button button-small button-fill color-red">Delete</a>');
		}
	});
}

function showEditForm(){
	$('#editForm').slideToggle();
}

// Delete and entry
function removeEntry(entryId) {
	var transaction = db.transaction(["entries"],"readwrite");
	var store = transaction.objectStore("entries");
	var request = store.delete(entryId);

	request.onsuccess = function(event){
		console.log('Entry removed');	
	}	
}

function editEntry(entryId){
	//Get transaction
	var transaction = db.transaction(["entries"],"readwrite");
	var store = transaction.objectStore("entries");
	
	var request = store.get(entryId);
	
	request.onsuccess = function(event) {
		var data = request.result;
		
		// Get New Data Values
		data.title 		= $('#title').val();
		data.subject 	= $('#subjectSelect').val();
		data.date		= $('#datePicker').val();
		data.body 		= $('#body').val();

		//Store Update
		var requestUpdate = store.put(data);
		requestUpdate.onerror = function(event) {
			console.log('There was a problem updating the entry');
		};
		requestUpdate.onsuccess = function(event) {
			console.log('Entry Updated...');
		};
	};
}

function getQuickNote(){
	if(localStorage.note == null){
		$('#quickNote').html("You can add a quick note here.");
	} else{
		$('#quickNote').html(localStorage.note);
	}
}

function showNoteForm(){
	$('#quickNote').toggle();
	$('#quickNoteForm').toggle();
}

function saveQuickNote(){
	var newNote = $('#note').val();
	localStorage.setItem('note', newNote);
}