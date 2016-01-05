var aVal = Math.random()*3.14;
var resultVal = Math.sin(aVal);
var a = [aVal];
var result = [resultVal];
return {input: a, output: result, outputVal: resultVal};






var resultVal = parseInt(result.join(''), 2);
var expectedVal = parseInt(expected_output.join(''), 2);
return Math.abs(expectedVal - resultVal);
