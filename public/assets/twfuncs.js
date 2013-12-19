function htmlDecode(input){
	e = document.createElement('div');
	e.innerHTML = input;
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

function dumpValsFromJSON(data){
	var ret = "";
	for(var rowIndex in data){
		ret += "<li>";
		for(var colIndex in data[rowIndex]){
			ret += data[rowIndex][colIndex] + " | ";
		}
		// Remove trailing pipe & space at end.
		ret = ret.slice(0, -2) + "</li>";
	}
	return ret;
}

function devAlert(){
	if(window.location.href != 'http://twdev.herokuapp.com') {
		var msg = '<div class="alert alert-danger text-center"><strong>You are on a development server.</strong></div>';
		var html = document.getElementsByClassName('container')[document.getElementsByClassName('container').length-1].innerHTML;
		document.getElementsByClassName('container')[document.getElementsByClassName('container').length-1].innerHTML = msg+html;
	}
} 