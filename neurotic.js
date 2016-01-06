(function(context){

  var default_strength = 0.001;

  /**
  Represents a node in the graph. The node contains a threshold that
  the total input must exceed if it will be passed on.
  */
  function Node(){
    this.threshold = Math.random();
  }

  /**
  Represents an edge between two nodes in the graph. The edge has a
  strength which determines what the input will be multiplied by.

  origin: origin node index.
  destination: destination node index.
  */
  function Edge(origin, destination){
    this.origin= origin;
    this.destination= destination;
    this.strength= Math.random()-0.5;
  }

  /**
  The base class for the neural net. This can either be constructed with no arguments or with 3.

  No arguments: creates an empty neural net which is meant to be filled with the import function.

  3 arguments:
    The first argument is the input layer size, which should be an integer.
    The second argument should be a list of the sizes of the hidden layers.
    The third argument is the size of the output layer.
  */
  function Neurotic(input, hidden_layer_list, output){
    //Each index is the id of the origin node in the edge
    this.map = [];
    //List of nodes. The index is the id of the node
    this.nodeList = [];
    this.input_length = input;
    this.output_length = output;
    this.hidden_sizes = hidden_layer_list;
    //How many edges there are in the net
    this.length = 0;

    /**
    Performs a query of the neural net. If an expected_output is given,
    the returned answer is evaluated for correctness. The evaluation function
    can be replaced by overwriting this.eval_error.

    input: array of floats.
    expected_output: optional array of floats.

    Returns a map of the format:
    {
      result: array of result values,
      error: analysis of error. The number lowers with more accuracy. This is only included if an expected_output is given
    }
    */
    this.query = function(input, expected_output){
      if (input.length > this.input_length){
        //Throw error if the input is too large
        throw "Input too large";
      }
      else if (input.length < this.input_length){
        //pad out input with zeros if too small
        for (var i = input.length; i < this.input_length; i++){
          input[i] = 0;
        }
      }
      if (expected_output && expected_output.length != this.output_length){
        //throw error if the expected output is not the same size as the net's output
        throw "Expected output length different from output length: " + expected_output.length + ' vs ' + this.output_length;
      }
      //this stores the values of the nodes as the signal propogatges.
      //the index of the value corresponds to the id of the node.
      var valueList = [];
      //Initialize valueList with the input values
      for (var i = 0; i < input.length; i++){
        valueList[i] = input[i];
      }
      //for each list of edges in the map
      for (var origin = 0; origin < this.map.length; origin++){
        var originList = this.map[origin];
        //for each edge in the list of edges
        for (var i = 0; i < originList.length; i++){
          var edge = originList[i];
          //the edge's origin node
          var originNode = this.nodeList[edge.origin];
          //initialize value for destination node, if it doesn't already exist
          valueList[edge.destination] = valueList[edge.destination] || 0;
          //calculate the value that will be propogated if it is above the
          //threshold using the sigmoid function
          var inputVal = sigmoid(valueList[edge.origin]);
          //if the value is above the threshold, propogate it to the destination
          if (inputVal > originNode.threshold){
            valueList[edge.destination] += inputVal*edge.strength;
          }
        }
      }

      //return the output, which are the last values in the list. This will be
      //the length of the specified output for the net
      var result = valueList.slice(this.map.length);
      if (expected_output){
        //this is a teaching query
        var error = this.eval_error(result, expected_output);
        //console.log('correct %: ' + correct);
        return {
          result: result,
          error: error
        };
      }
      else{
        //this is a normal query
        return {
          result: result
        };
      }
    }

    /**
    Trains the neural net using a genetic algorithm to change the edge strengths and node thresholds.

    trainingFunction: a function which should return a map of format:
      {
        input: input array,
        output: correct output array
      },
    numTraining: number of times to run the query before analysing the results
    */
    this.train = function(trainingFunction, numTraining){
      //initialize the initial and final error values
      var initError = 0;
      var finalError = 0;
      var trainingList = [];
      //get error data the specified number of times
      for (var x = 0; x < numTraining; x++){
        //use the training function to get the test data
        var data = trainingFunction();
        //Add data to training list
        trainingList.push(data);
        //give the net a training query
        var results = this.query(data.input, data.output);
        //add the error number to the initial error value
        initError += results.error;
      }
      //get the average error value
      initError /= numTraining;
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
      for (var x = 0; x < trainingList.length; x++){
        var data = trainingList[x];
        var results = this.query(data.input, data.output);
        finalError += results.error;
      }
      finalError /= numTraining;
      if (finalError > initError){
        if (isThresholdTrain){
          node.threshold = old;
        }
        else{
          edge.strength = old;
        }
      }
      return finalError;
    }

    /**
    Animates the net on the provided canvas. Also runs a query.
    The nodes are represented by circles, the edges by lines. If a node or edge
    is red, then that means that it's strength or threshold is negative. The weight
    of the lines depends on the absolute value of their strength or threshold.

    canvas_id: id of the canvas on the page to display the net.
    input: input array for the query.
    expected_output: correct output array for the query.
    */
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

    /**
    Exports the net into a string, readable by the import function.
    */
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

    /**
    Imports an exported neural net string. Overwrites current attributes and
    net with imported info.

    raw: exported neural net string.
    */
    this.import = function(raw){
      var jraw = JSON.parse(raw);
      for (var key in jraw){
        this[key] = jraw[key];
      }
    }

    /**
    Evaluates how erroneous the result is. This can be overwritten for a custom
    evaluation.

    result: output array.
    expected_output: correct answer array.

    Returns a number which signifies the average error.
    */
    this.eval_error = function(result, expected_output){
      var error = 0;
      for (var i = 0; i < expected_output.length; i++){
        error += Math.abs(expected_output[i] - result[i]);
      }
      return error;
    }

    /**
    constructor
    */
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

  /**
  Sigmoid function returns a number in the range 0 to 1.

  input: float from -inf to inf
  */
  function sigmoid(input){
    return 1/(1+Math.pow(Math.E, -1*input/1.0));
  }

  context.Neurotic = Neurotic;
})(window);
