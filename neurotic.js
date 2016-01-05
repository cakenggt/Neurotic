(function(context){

  var default_strength = 0.001;

  function Node(){
    this.threshold = Math.random()
  }

  function Edge(origin, destination){
    this.origin= origin;
    this.destination= destination;
    this.strength= Math.random()-0.5;
  }

  function Neurotic(input, hidden_layer_list, output){
    //Each entry is the id of the origin node in the edge
    this.map = [];
    this.nodeList = [];
    this.input_length = input;
    this.output_length = output;
    this.hidden_sizes = hidden_layer_list;
    this.length = 0;

    this.query = function(input, expected_output){
      if (input.length > this.input_length){
        throw "Input too large";
      }
      else if (input.length < this.input_length){
        //pad out input
        for (var i = input.length; i < this.input_length; i++){
          input[i] = 0;
        }
      }
      if (expected_output && expected_output.length != this.output_length){
        throw "Expected output length different from output length: " + expected_output.length + ' vs ' + this.output_length;
      }
      var valueList = [];
      //Initialize valueList with input values
      for (var i = 0; i < input.length; i++){
        valueList[i] = input[i];
      }
      for (var origin = 0; origin < this.map.length; origin++){
        var originList = this.map[origin];
        for (var i = 0; i < originList.length; i++){
          var edge = originList[i];
          var originNode = this.nodeList[edge.origin];
          //initialize value for destination node
          valueList[edge.destination] = valueList[edge.destination] || 0;
          //set new value for destination node
          //Sigmoid function
          var inputVal = sigmoid(valueList[edge.origin]);
          //Threshold
          if (inputVal > originNode.threshold){
            valueList[edge.destination] += inputVal*edge.strength;
          }
        }
      }

      //return output
      var result = valueList.slice(this.map.length);
      //end of new code------------------------------------------------------
      if (expected_output){
        //teach
        //console.log('result: ' + result);
        var correct = this.eval_correct(result, expected_output);
        //console.log('correct %: ' + correct);
        return {
          result: result,
          correct: correct
        };
      }
      else{
        //query
        return {
          result: result
        };
      }
    }

    this.train = function(trainingFunction, numTraining){
      var initCorrect = 0;
      var finalCorrect = 0;
      for (var x = 0; x < numTraining; x++){
        var data = trainingFunction();
        var results = this.query(data.input, data.output);
        initCorrect += results.correct;
      }
      initCorrect /= numTraining;
      var i = Math.floor(this.map.length * Math.random());
      var j = Math.floor(this.map[i].length * Math.random());
      var edge = this.map[i][j];
      var node = this.nodeList[edge.origin];
      var isThresholdTrain = Math.random()>0.5;
      var old;
      if (isThresholdTrain){
        old = node.threshold;
      }
      else{
        old = edge.strength;
      }
      //evolve
      if (isThresholdTrain){
        node.threshold += (Math.random()-0.5)/10;
      }
      else{
        edge.strength += Math.random()-0.5;
      }
      for (var x = 0; x < numTraining; x++){
        var data = trainingFunction();
        var results = this.query(data.input, data.output);
        finalCorrect += results.correct;
      }
      finalCorrect /= numTraining;
      if (finalCorrect > initCorrect){
        if (isThresholdTrain){
          node.threshold = old;
        }
        else{
          edge.strength = old;
        }
      }
      return finalCorrect;
    }

    this.animate = function(canvas_id, input, expected_output){
      //this is a teaching query
      var c = document.getElementById(canvas_id);
      var ctx = c.getContext("2d");
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.lineCap="round";
      var results = this.query(input, expected_output);
      if (!this.loc_list){
        //If not already existing, then create it
        var width = c.width;
        var height = c.height;
        //List of all node locations
        var loc_list = [];
        var current_index = 0;
        for (var i = 0; i < this.input_length; i++){
          loc_list[i] = {
            x: (i*width/this.input_length)+(width/this.input_length/2),
            y: 10
          };
          current_index++;
        }
        for (var level = 0; level < this.hidden_sizes.length; level++){
          var level_length = this.hidden_sizes[level];
          for (var hi = 0; hi < level_length; hi++){
            loc_list[current_index] = {
              x: (hi*width/level_length)+(width/level_length/2),
              y: (level+1)*height/(this.hidden_sizes.length+2)
            };
            current_index++;
          }
        }
        for (var o = 0; o < this.output_length; o++){
          loc_list[current_index] = {
            x: (o*width/this.output_length)+(width/this.output_length/2),
            y: height
          };
          current_index++;
        }
        this.loc_list = loc_list;
      }
      for (var n = 0; n < this.loc_list.length; n++){
        //draw nodes
        ctx.beginPath();
        ctx.lineWidth = 1;
        var node = this.nodeList[n];
        var radius = Math.abs(node.threshold*50);
        var loc = this.loc_list[n];
        ctx.arc(loc.x,loc.y,radius,0,2*Math.PI);
        if (node.threshold < 0){
          ctx.strokeStyle = 'red';
        }
        else{
          ctx.strokeStyle = 'black';
        }
        ctx.stroke();
      }
      for (var i = 0; i < this.map.length; i++){
        //draw edges
        var edge_list = this.map[i];
        for (var e = 0; e < edge_list.length; e++){
          ctx.beginPath();
          var edge = edge_list[e];
          var line_width = Math.pow(edge.strength, 1/2);
          ctx.lineWidth = line_width;
          if (edge.strength < 0){
            ctx.strokeStyle = 'red';
          }
          else{
            ctx.strokeStyle = 'black';
          }
          var origin = this.loc_list[edge.origin];
          var destination = this.loc_list[edge.destination];
          ctx.moveTo(origin.x, origin.y);
          ctx.lineTo(destination.x, destination.y);
          ctx.stroke();
        }
      }
      return results;
    }

    this.export = function(){
      return JSON.stringify({
        map: this.map,
        nodeList: this.nodeList,
        input_length: this.input_length,
        output_length: this.output_length,
        hidden_sizes: this.hidden_sizes,
        length: this.length
      });
    }

    this.import = function(raw){
      var jraw = JSON.parse(raw);
      for (var key in jraw){
        this[key] = jraw[key];
      }
    }

    this.eval_correct = function(result, expected_output){
      var correct = 0;
      for (var i = 0; i < expected_output.length; i++){
        correct += Math.abs(expected_output[i] - result[i]);
      }
      return correct;
    }

    //constructor
    if (input == undefined){
      console.log('Empty Neurotic created.\nUse the import function to fill.');
      return;
    }

    for (var h = 0; h < hidden_layer_list.length; h++){
      //connect each hidden layer with previous layer
      var layer_size = hidden_layer_list[h];
      if (h == 0){
        //connect with input
        for (var i_node = 0; i_node < input; i_node++){
          //initialize node list for this input
          var edge_list = [];
          var map_length = this.map.length;
          for (var h_node = input; h_node < input+layer_size; h_node++){
            //connect each h_node with input
            var edge = new Edge(i_node, h_node);
            edge_list.push(edge);
          }
          //console.log('from i node '+i_node);
          this.map[i_node] = edge_list;
          this.length += edge_list.length;
        }
      }
      else{
        //connect with previous hidden layer
        var map_length = this.map.length;
        for (var last_h_node = map_length; last_h_node < map_length+hidden_layer_list[h-1]; last_h_node++){
          //initialize node list for this input
          var edge_list = [];
          for (var h_node = map_length+hidden_layer_list[h-1]; h_node < map_length+hidden_layer_list[h-1]+layer_size; h_node++){
            //connect each h_node with input
            var edge = new Edge(last_h_node, h_node);
            edge_list.push(edge);
          }
          //console.log('from h node '+last_h_node);
          this.map[last_h_node] = edge_list;
          this.length += edge_list.length;
        }
      }
    }
    var map_length = this.map.length;
    for (var last_h_node = map_length; last_h_node < map_length+hidden_layer_list[hidden_layer_list.length-1]; last_h_node++){
      //connect last hidden layer to output
      var edge_list = [];
      for (var o_node = map_length+hidden_layer_list[hidden_layer_list.length-1]; o_node < map_length+hidden_layer_list[hidden_layer_list.length-1]+output; o_node++){
        //connect each h_node with input
        var edge = new Edge(last_h_node, o_node);
        edge_list.push(edge);
      }
      //console.log('from h node '+last_h_node+' to o node');
      this.map[last_h_node] = edge_list;
      this.length += edge_list.length;
    }
    //Add nodes to node list
    for (var n = 0; n < input; n++){
      //Add new node to node list
      this.nodeList.push(new Node());
    }
    for (var l = 0; l < hidden_layer_list.length; l++){
      for (var h = 0; h < hidden_layer_list[l]; h++){
        //Add new node to node list
        this.nodeList.push(new Node());
      }
    }
    for (var o = 0; o < output; o++){
      //Add new node to node list
      this.nodeList.push(new Node());
    }
  }

  function sigmoid(input){
    return 1/(1+Math.pow(Math.E, -1*input/1.0));
  }

  context.Neurotic = Neurotic;
})(window);
