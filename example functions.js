var aVal = Math.random()*3.14;
var aDeg = aVal/3.14*180;
var resultVal = Math.round(Math.sin(aVal)*100);
var a = Math.round(aDeg).toString(2).split('');
var result = resultVal.toString(2).split('');
while (a.length < 8){
  a.unshift(0);
}
while (result.length < 8){
  result.unshift(0);
}
return {input: a, output: result, outputVal: resultVal};






var resultVal = parseInt(result.join(''), 2);
var expectedVal = parseInt(expected_output.join(''), 2);
return Math.abs(expectedVal - resultVal);
