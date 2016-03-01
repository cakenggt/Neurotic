var Neurotic = require('./neurotic.js');

$(function(){
  var n = new Neurotic(8,[8],8);
  window.cont = true;
  var count = 0;
  var error = Infinity;
  function anim(){
    document.getElementById('start').disabled = true;
    document.getElementById('stop').disabled = false;
    //checking which radio button is clicked
    var testFunction;
    var radios = document.getElementsByName('test');
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            // do whatever you want with the checked radio
            switch(radios[i].value){
              case 'sine':
                testFunction = sine;
                break;
              case 'sum':
                testFunction = sum;
                break;
              case 'difference':
                testFunction = difference;
                break;
              case 'iris':
                testFunction = iris;
                break;
                case 'xor':
                  testFunction = xor;
                  break;
              case 'custom':
                testFunction = new Function('result', 'expected_output', document.getElementById('testFunction').value);
                break;
            }

            // only one radio can be logically checked, don't check the rest
            break;
        }
    }
    var data = testFunction();
    if (count % 200 === 0){
      n.animate('canvas',data.input,data.output);
      document.getElementById('log').innerText += '\nError %: ' + error;
      count = 0;
    }
    else{
      error = n.train(testFunction, 1000);
    }
    if (window.cont){
      requestAnimationFrame(anim);
    }
    else{
      //stopping animation
      document.getElementById('start').disabled = false;
      document.getElementById('stop').disabled = true;
    }
    count++;
  }

  function query(){
    var result = n.query(JSON.parse(document.getElementById("queryValue").value));
    document.getElementById('queryResult').innerText = result.result;
    console.log(result);
  }

  function createNewNet(){
    var input = parseInt(document.getElementById('input').value);
    var hidden = JSON.parse(document.getElementById('hidden').value);
    var output = parseInt(document.getElementById('output').value);
    n = new Neurotic(input, hidden, output);
  }

  $('#create').on('click', createNewNet);
  $('#query').on('click', query);
  $('#start').on('click', function(){
    window.cont=true;
    anim();
  });
  $('#stop').on('click', function(){
    window.cont=false;
  });
});
