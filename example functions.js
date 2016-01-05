///////////////////Sine///////////////
//test function
var aVal = Math.random()*3.14;
var resultVal = Math.sin(aVal);
var a = [aVal];
var result = [resultVal];
return {input: a, output: result, outputVal: resultVal};

//eval function
var resultVal = parseFloat(result[0]);
var expectedVal = parseFloat(expected_output[0]);
return Math.abs(expectedVal - resultVal);
//////////////////////////////////////////

/////////////////Sum////////////////
//Test function
var aVal = Math.random() * 10;
var bVal = Math.random() * 10;
var resultVal = aVal + bVal;
return {input: [aVal, bVal], output: [resultVal]};

///////////////////////////////////////
