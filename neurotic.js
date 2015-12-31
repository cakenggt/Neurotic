(function(context){

  var default_strength = 0.001;

  function Neurotic(input, hidden_layer_list, output){
    //Each entry is the id of the origin node in the edge
    this.map = [];
    this.input_length = input;
    this.output_length = output;
    this.length = 0;

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
          console.log('from i node '+i_node);
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
          console.log('from h node '+last_h_node);
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
      console.log('from h node '+last_h_node+' to o node');
      this.map[last_h_node] = node_list;
      this.length += node_list.length;
    }

    this.query = function(input){
      if (input.length > this.input_length){
        throw "Input too large";
      }
      else if (input.length < this.input_length){
        //pad out input
        for (var i = input.length; this.input_length; i++){
          input[i] = 0;
        }
      }
      var next = [];
      for (var i = 0; i < input.length; i++){
        //go through initial input with input layer
        var node = this.map[i];
        if (input[i]){
          var highest = [];
          for (var edge_index = 0; edge_index < node.length; edge_index++){
            //find highest strength connection to next node
            var edge = node[edge_index];
            if (edge.strength > 0.5){
              highest.push(edge);
            }
          }
          for (var j = 0; j < highest.length; j++){
            if (next.indexOf(highest[j].destination) == -1){
              next.push(highest[j].destination);
            }
          }
        }
      }
      while (next[0] < this.map.length){
        console.log('next is ' + next);
        //while the next nodes are not in the output range
        var next_next = [];
        for (var i = 0; i < next.length; i++){
          var node = this.map[next[i]];
          var highest = [];
          for (var edge_index = 0; edge_index < node.length; edge_index++){
            //find highest strength connection to next node
            var edge = node[edge_index];
            if (edge.strength > 0.5){
              highest.push(edge);
            }
          }
          for (var j = 0; j<highest.length; j++){
            if (next_next.indexOf(highest[j].destination) == -1){
              next_next.push(highest[j].destination);
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
      return result.slice(this.map.length);
    }

    this.teach = function(input, expected_output){
      if (input.length > this.input_length){
        throw "Input too large";
      }
      else if (input.length < this.input_length){
        //pad out input
        for (var i = input.length; this.input_length; i++){
          input[i] = 0;
        }
      }
      if (expected_output.length != this.output_length){
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
            if (Math.random() < edge.strength){
              highest.push(edge);
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
            if (Math.random() < edge.strength){
              highest.push(edge);
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
      result = result.slice(this.map.length);
      console.log('result: ' + result);
      console.log(backprop);
      for (var i = 0; i < expected_output.length; i++){
        if (expected_output[i] == result[this.map.length+i]){
          //strengthen
          modify_weight(backprop, this.map.length+i, 1.1);
        }
        else{
          //weaken
          modify_weight(backprop, this.map.length+i, 1/1.1);
        }
      }
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
        edge.strength *= modifier;
        if (backprop[edge.origin]){
          next_next = next_next.concat(backprop[edge.origin]);
        }
      }
      next = next_next;
      next_next = [];
    }
  }

  context.Neurotic = Neurotic;
})(window);
