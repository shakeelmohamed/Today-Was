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