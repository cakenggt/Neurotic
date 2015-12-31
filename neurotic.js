(function(context){

  var default_strength = 0.001;

  function Neurotic(input, hidden_layer_list, output){
    //Each entry is the id of the origin node in the edge
    this.map = [];
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
        for (var i = input.length; this.input_length; i++){
          input[i] = 0;
        }
      }
      if (expected_output && expected_output.length != this.output_length){
        throw "Expected output length different from output length";
      }
      var backprop = [];
      var next = [];
      for (var i = 0; i < input.length; i++){
        //go through initial input with input layer
        var node = this.map[i];
        if (input[i]){
          var highest = [];
          for (var edge_index = 0; edge_index < node.length; edge_index++){
            //find highest strength connection to next node
            var edge = node[edge_index];
            if (expected_output){
              if (Math.random() < edge.strength){
                highest.push(edge);
              }
            }
            else{
              if (edge.strength > 0.5){
                highest.push(edge);
              }
            }
          }

          for (var j = 0; j < highest.length; j++){
            if (next.indexOf(highest[j].destination) == -1){
              next.push(highest[j].destination);
              //add to backprop history
              if (!backprop[highest[j].destination]){
                backprop[highest[j].destination] = [];
              }
              backprop[highest[j].destination].push(highest[j]);
            }
          }
        }
      }
      while (next[0] < this.map.length){
        //while the next nodes are not in the output range
        var next_next = [];
        for (var i = 0; i < next.length; i++){
          var node = this.map[next[i]];
          var highest = [];
          for (var edge_index = 0; edge_index < node.length; edge_index++){
            //find highest strength connection to next node
            var edge = node[edge_index];
            if (expected_output){
              if (Math.random() < edge.strength){
                highest.push(edge);
              }
            }
            else{
              if (edge.strength > 0.5){
                highest.push(edge);
              }
            }
          }
          for (var j = 0; j<highest.length; j++){
            if (next_next.indexOf(highest[j].destination) == -1){
              next_next.push(highest[j].destination);
              //Add to backprop history
              if (!backprop[highest[j].destination]){
                backprop[highest[j].destination] = [];
              }
              backprop[highest[j].destination].push(highest[j]);
            }
          }
        }
        next = next_next;
      }
      //return output
      var result = []
      result.length = this.map.length + this.output_length;
      for (var i = 0; i < next.length; i++){
        result[next[i]] = 1;
      }
      for (var i = 0; i < result.length; i++){
        //fill result with 0's
        if (!result[i]){
          result[i] = 0;
        }
      }
      result = result.slice(this.map.length);
      if (expected_output){
        //teach, return backprop
        //console.log('result: ' + result);
        var correct = eval_correct(result, expected_output);
        for (var i = 0; i < expected_output.length; i++){
          if (result[i]){
            if (expected_output[i] == result[i]){
              //strengthen
              modify_weight(backprop, this.map.length+i, 1);
            }
            else{
              //weaken
              modify_weight(backprop, this.map.length+i, -1);
            }
          }
        }
        //console.log('correct %: ' + correct);
        return {
          backprop: backprop,
          result: result,
          correct: correct
        };
      }
      else{
        //query
        return result;
      }
    }

    this.animate = function(canvas_id, input, expected_output){
      if (expected_output){
        //this is a teaching query
        var c = document.getElementById(canvas_id);
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.beginPath();
        ctx.lineCap="round";
        var results = this.query(input, expected_output);
        var backprop = results.backprop;
        if (!this.loc_list){
          //If not already existing, then create it
          var width = c.width = window.innerWidth;
          var height = c.height = window.innerHeight;
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
        for (var i = 0; i < this.map.length; i++){
          //draw edges
          var edge_list = this.map[i];
          for (var e = 0; e < edge_list.length; e++){
            var edge = edge_list[e];
            var line_width = edge.strength * 5;
            ctx.lineWidth = line_width;
            var origin = this.loc_list[edge.origin];
            var destination = this.loc_list[edge.destination];
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(destination.x, destination.y);
          }
          ctx.stroke();
        }
        return results;
      }
    }

    this.export = function(){
      return JSON.stringify({
        map: this.map,
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
          var node_list = [];
          var map_length = this.map.length;
          for (var h_node = input; h_node < input+layer_size; h_node++){
            //connect each h_node with input
            var edge = {
              origin: i_node,
              destination: h_node,
              strength: Math.random()
            };
            node_list.push(edge);
          }
          //console.log('from i node '+i_node);
          this.map[i_node] = node_list;
          this.length += node_list.length;
        }
      }
      else{
        //connect with previous hidden layer
        var map_length = this.map.length;
        for (var last_h_node = map_length; last_h_node < map_length+hidden_layer_list[h-1]; last_h_node++){
          //initialize node list for this input
          var node_list = [];
          for (var h_node = map_length+hidden_layer_list[h-1]; h_node < map_length+hidden_layer_list[h-1]+layer_size; h_node++){
            //connect each h_node with input
            var edge = {
              origin: last_h_node,
              destination: h_node,
              strength: Math.random()
            };
            node_list.push(edge);
          }
          //console.log('from h node '+last_h_node);
          this.map[last_h_node] = node_list;
          this.length += node_list.length;
        }
      }
    }
    var map_length = this.map.length;
    for (var last_h_node = map_length; last_h_node < map_length+hidden_layer_list[hidden_layer_list.length-1]; last_h_node++){
      //connect last hidden layer to output
      var node_list = [];
      for (var o_node = map_length+hidden_layer_list[hidden_layer_list.length-1]; o_node < map_length+hidden_layer_list[hidden_layer_list.length-1]+output; o_node++){
        //connect each h_node with input
        var edge = {
          origin: last_h_node,
          destination: o_node,
          strength: Math.random()
        };
        node_list.push(edge);
      }
      //console.log('from h node '+last_h_node+' to o node');
      this.map[last_h_node] = node_list;
      this.length += node_list.length;
    }
  }

  function modify_weight(backprop, index, modifier){
    //backpropogate through the backprop list and
    //multiply strengths by the modifier
    var next = [].concat(backprop[index]);
    var next_next = [];
    while (next.length != 0){
      for (var i = 0; i < next.length; i++){
        if (!next[i]){
          continue;
        }
        var edge = next[i];
        edge.strength = (Math.tanh(Math.atanh((edge.strength*2)-1)+modifier)+1)/2
        if (backprop[edge.origin]){
          next_next = next_next.concat(backprop[edge.origin]);
        }
      }
      next = next_next;
      next_next = [];
    }
  }

  function eval_correct(result, expected_output){
    var correct = 0;
    for (var i = 0; i < expected_output.length; i++){
      if (!expected_output[i] == !result[i]){
        correct ++;
      }
    }
    return correct/expected_output.length;
  }

  context.Neurotic = Neurotic;
})(window);
