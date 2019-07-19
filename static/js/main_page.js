async function main(){
  /*
  create svg windows
  */

  var svgWidth = 800;
  var svgHeight = 600;

  var margin = { top: 20, right: 20, bottom:30, left: 30};
  var width = svgWidth - margin.left - margin.right ;
  var height = svgHeight - margin.top - margin.bottom ;

  var svg = d3.select('svg')
  	.attr('width', svgWidth)
  	.attr('height', svgHeight);

  var svg2 = d3.select('#svg2')
  	.attr('width', svgWidth)
  	.attr('height', svgHeight);

  //READING IN DATA FOR LINE PLOT 1

  $.get("/get_sensors_with_obs_type", async function(api_data){

    var dict = []
    var names = []
    var longNames = []
    var levels = []
    var times = []


    var sum_data = {}
    var sum_times = []
    var sum_levels = []

    var i=0;
    var promices = [];


    start_date = "April 1 2019";
    test_date = new Date();
    var yyyy = (test_date.getYear() + 1900).toString();
    var mm = (test_date.getMonth() + 1).toString();
    var dd = (test_date.getDate()).toString();
    var hh = (test_date.getHours()).toString();
    var min = (test_date.getMinutes()).toString();
    test_date = yyyy + " " + mm + " " + dd + " " + hh + ":" + min
    end_date = test_date;
    console.log(start_date)
    console.log(end_date)


    for(sensor of api_data){
      dict.push({
        'name': sensor.desc,
        'pin': sensor.name,
        'elev' : +sensor.elev,
        'coords': sensor.coords,
        'pairs': []
      })

      //names.push(sensor.name);
      //longNames.push(sensor.desc);

      promices.push($.get("/get_obs_for_link", {
                                      link: sensor.link,
                                      start_date: start_date}))

      }
      var datas = [];

      for (promice of promices){
        datas.push(await promice);
      }
      for (data of datas){
        console.log(data)
        //let data = await promice;
        data.forEach(function(d){
          dict[i].pairs.push({
            'y':dict[i].elev + (+d[0]),
            'x':new Date(d[1]),
            'des':dict[i].name,
            'pin':dict[i].pin
          });
          levels.push(dict[i].elev + (+d[0]));
          times.push((new Date(d[1])));
        });
        i++;
      }

    //}
    /*
    var longnames2data = {}

    //console.log(longNames);
  	for (var i=0; i < longNames.length; i++){
  		longnames2data[longNames[i]] = dict[i]
  	}
    */
    //console.log(longnames2data);

  	// remove sensors with no water level readings
    /*
  	for (var i=0; i<dict.length; i++){
      //console.log(dict[i].name);
  		if (dict[i].pairs.length ==0){
  			longNames.splice(i,1)
  			dict.splice(i,1)
  		}
  	}
    */

    prune = []

  	for (var i=0; i<dict.length; i++){
    		//console.log(dict[i].name)
    		//console.log(dict[i].pairs.length)
    		if (dict[i].pairs.length > 0){
    			longNames.push(dict[i].name)
    			names.push(dict[i].pin)
    			prune.push(dict[i])
    		}
    	}

    	dict = prune

  	// access all the data for a certain sensor based on its name
      var longnames2data = {

    			}

  	for (var i=0; i < longNames.length; i++){
    		longnames2data[longNames[i]] = dict[i]
    	}

    /*
  	create x axis
  	make x scale
  	calculate the bounds for x domain
  	make axis object and translate it to the bottom on the svg
  	*/

  	times = times.sort()

  	var overallMaxT = d3.max(times)
  	var overallMinT = d3.min(times)

  	var startTime = times[parseInt(times.length/1.05)]

  	var x = d3.scaleTime()
  		//.domain([overallMinT, overallMaxT])
  		.domain([startTime, overallMaxT]) // start zoomed in on a smaller window
  		.range([margin.left, width - margin.right]);

  	var xAxis = d3.axisBottom().scale(x).ticks(width / 80).tickSizeOuter(0)

  	svg.append('g')
  		.attr("class", "x-axis")
  		.attr('transform', 'translate(0,'+ (height - margin.bottom).toString()+')')
  		.call(xAxis);

      /*
    	create y axis
    	make y scale
    	calculate the domin for the y axis
    	*/

    	var overallMaxD = d3.max(levels)
    	var overallMinD = d3.min(levels)

    	var y = d3.scaleLinear()
        	.domain([overallMinD, overallMaxD])
        	.range([height - margin.bottom, margin.top])

    	var yAxis = g => g
    		.attr('transform', 'translate('+(margin.left).toString() + ',0)')
    		.call(d3.axisLeft(y))
    		.call(g => g.select(".domain").remove())
    		.call(g => g.select(".tick:last-of-type text").clone()
    			.attr("text-anchor", "start")
    			.style("font", "12px sans-serif")
    			.style('font-weight', 'bold')
    			.text('Water Depth'))

    	svg.append('g')
    		.call(yAxis);


        /*
      	making the dots go on the chart
      	*/

      	// put a text label with sensor name

      	var label = svg.append('g')
      		.attr("class", "label")
      		.attr('transform', 'translate('+(width-margin.right-60).toString()+','+ (height - margin.bottom-20).toString()+')')

      	label.append("text")
      		.attr("class", "label")
      		.style("font", "12px sans-serif")
      		.style('font-weight', 'bold')
      		.attr("text-anchor", "middle");

      	label.select("text").text('');


        /*
      	allow hovering over each sensor
      	bring the selected sensor to the front
      	lower the opacity of all the other sensors
      	*/

      	function handleMouseOver(d) {

          	svg.selectAll('.dot')
          		.attr("fill-opacity","0.01")

          	let data1 = d3.select(this).data()

          	svg.selectAll('.'+data1[0].pin)
          		.raise()
          		.attr("fill-opacity","1")

          	label.select("text").text(data1[0].des);

       		}

      	var doNotHighlight = function(){

      		svg.selectAll(".dot")
      			.attr("fill-opacity","1")

      		label.select("text").text('');

      		}

      	var cx = function(d){
      		return x(d.x)
      	}

      	var cy = function(d){
      		return y(d.y)
      	}

      	let dots = svg.append('g')
      		.attr('class', 'dot');

      	// generate random color for each sensor since there are so many
      	var posCols =[]

        function hashCode(str) { // java String#hashCode
          var hash = 0;
          for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return hash;
        }

        function intToRGB(i){
          var c = (i & 0x00FFFFFF)
          .toString(16)
          .toUpperCase();
          return "00000".substring(0, 6 - c.length) + c;
        }


      	for (var i =0; i<longNames.length ; i++){
          var col = intToRGB(hashCode(longNames[i]));
          posCols.push(col);
      		//var r = Math.floor(Math.random() * (255  + 1));
      		//var g = Math.floor(Math.random() * (255  + 1));
      		//var b = Math.floor(Math.random() * (255  + 1));
      		//posCols.push('rgb('+r+','+g+','+b+')')
      	}

      	//var pickColor = d3.scaleOrdinal()
      	//		.domain(names)
      	//		.range(posCols)




    //READ IN CSV DATA FOR ANOMALY LAYER
    var all_anom = []
    var onehour = []
    var oneday = []
    var threeday = []
    var minval = []
    $.get("/daily_output", function(data){
    console.log(data);
      var run_date = new Date(data[0].run_date);

      data.forEach(function(d){
        if (d.flag_1hour == "True"){
          onehour.push({
            "name": d.desc,
            "res": d.test_residuals_1hour
          })
        }

        if (d.flag_1day == "True"){
          oneday.push({
            "name": d.desc,
            "res": d.test_residuals_1day
          })
        }

        if (d.flag_3days == "True"){
          threeday.push({
            "name": d.desc,
            "res": d.test_residuals_3days
          })
        }

        if (d.flag_min_vals == "True"){
          minval.push({
            "name": d.desc,
            "res": d.num_test_vals
          })
        }
      });

      onehour.sort((firstEl, secondEl) => secondEl.res - firstEl.res)
      var onehour_names = onehour.map((sens) => sens.name);

      oneday.sort((firstEl, secondEl) => secondEl.res - firstEl.res)
      var oneday_names = oneday.map((sens) => sens.name);

      threeday.sort((firstEl, secondEl) => secondEl.res - firstEl.res)
      var threeday_names = threeday.map((sens) => sens.name);

      minval.sort((firstEl, secondEl) => secondEl.res - firstEl.res)
      var minval_names = minval.map((sens) => sens.name);

      all_anom = onehour_names.concat(oneday_names).concat(threeday_names).concat(minval_names);


      //ANOMALY BUTTON
      var anom_button = document.getElementById("anom_button");
      anom_button.onclick = toggleAnomaly;

      function toggleAnomaly(){
        var res_text = document.getElementById("error-text");
        if (res_text.style.display == "none"){
          showAnomaly();
        }else{
          hideAnomaly();
        }
      }



      function showAnomaly(){
            //display anomalous sensor names - can only be run once
            disp_anom_sens();
            document.getElementById("error-text").style.display = "block";
            document.getElementById("anom-sens-text").style.display = "block";


            //uncheck everything
            for (name of longNames){
              var box = document.getElementById(name);
              box.checked=false;
            }
            updateChecks();

            //check boxes
            for (name of all_anom){
              var box = document.getElementById(name);
              if (box != null){
                box.checked = true;
              }
            }
            updateChecks();

            //adjust x axis
            var ndays = 3 * 1000 * 60 * 60 * 24;
            var anom_startTime = new Date(run_date - ndays);
            x.domain([anom_startTime, run_date]);
            svg.select('.x-axis').call(xAxis);
            var anomalyDomain = x.domain();

            //sliderRange.default([anom_startTime, run_date]);
            //console.log(sliderRange.default);
            gRange.call(sliderRange);

            //re-draw points
            for (var i=0; i<names.length; i++){
              svg.selectAll('.'+names[i])
              .attr("cx", function(d){
                  if (d.x < anomalyDomain[1] && d.x > anomalyDomain[0]) {
                    return cx(d)
                  }
                  else {
                    return null ;
                  }
                })
                .attr("cy", function(d){
                  if (d.x < anomalyDomain[1] && d.x > anomalyDomain[0]) {
                    return cy(d)
                  }
                  else {
                    return null ;
                  }
                })
               }
      }


     function hideAnomaly(){
       //hide anomalous sensor names
        document.getElementById("error-text").style.display = "none";
        document.getElementById("anom-sens-text").style.display = "none";

       //uncheck all boxes (including any user might have selected after clicking show anomaly)
       for (name of longNames){
         var box = document.getElementById(name);
          if (box != null){
            box.checked = false;
          }
       }
       updateChecks();
      }

      var disp_called = false;
      function disp_anom_sens(){
        if (disp_called == false){
          for (name of onehour_names){
            var node = document.createElement("LI");
            var textnode = document.createTextNode(name);
            node.style.color = intToRGB(hashCode(name));
            node.style.font = "bold 14px sans-serif";
            node.appendChild(textnode);
            document.getElementById("type1").appendChild(node);
          }

          for (name of oneday_names){
            var node = document.createElement("LI");
            var textnode = document.createTextNode(name);
            node.style.color = intToRGB(hashCode(name));
            node.style.font = "bold 14px sans-serif";
            node.appendChild(textnode);
            document.getElementById("type2").appendChild(node);
          }

          for (name of threeday_names){
            var node = document.createElement("LI");
            var textnode = document.createTextNode(name);
            node.style.color = intToRGB(hashCode(name));
            node.style.font = "bold 14px sans-serif";
            node.appendChild(textnode);
            document.getElementById("type3").appendChild(node);
          }

          for (name of minval_names){
            var node = document.createElement("LI");
            var textnode = document.createTextNode(name);
            node.style.color = intToRGB(hashCode(name));
            node.style.font = "bold 14px sans-serif";
            node.appendChild(textnode);
            document.getElementById("type4").appendChild(node);
          }
        }
        disp_called=true;
      }
    })




    //READ IN DATA FOR STATS PLOT
    for(sensor of dict){
      //console.log(sensor);
      sensor_name = sensor.name;
      sensor_pin = sensor.pin;
      var group_data = d3.nest()
                   .key(d => d.des)
                   .key(d => (d3.isoParse(d.x).getYear() + 1900) + "-" + (d3.isoParse(d.x).getMonth() + 1)
                      + "-" + d3.isoParse(d.x).getDate())
                   .entries(sensor.pairs);

      //console.log("group_data");
      //console.log(group_data);

      group_data.forEach(function (d){
        sum_data[d.key]={
          'max': [],
     		  'min': [],
     		  'avg': []
        }
        d.values.forEach(function(rdg){
          let s_values = [];
          for (value of rdg.values){
            s_values.push(value.y);
          }
          sum_times.push(new Date(rdg.key));
          sum_levels.push(d3.max(s_values));
          sum_levels.push(d3.min(s_values));
          sum_data[d.key].max.push({'date': new Date(rdg.key), 'max': d3.max(s_values), 'pin': sensor_pin, 'des': sensor_name})
          sum_data[d.key].min.push({'date': new Date(rdg.key), 'min': d3.min(s_values), 'pin': sensor_pin, 'des': sensor_name})
          sum_data[d.key].avg.push({'date': new Date(rdg.key), 'avg': d3.mean(s_values), 'pin': sensor_pin, 'des': sensor_name})
        });
      })
    }


    statsname2data = { }

  	for (var i=0; i < longNames.length; i++){
  		statsname2data[longNames[i]] = sum_data[longNames[i]]
  	}

    sum_data = Object.values(sum_data);
    //console.log(sum_data);

    /*
  	create x axis
  	make x scale
  	make axis object and translate it o the bottom on the svg
  	*/

  	var overallMaxT2 = d3.max(sum_times)
  	var overallMinT2 = d3.min(sum_times)

  	var x2 = d3.scaleTime()
  		.domain([overallMinT2, overallMaxT2])
  		.range([margin.left, width - margin.right]);

  	var xAxis2 = d3.axisBottom().scale(x2).ticks(width / 80).tickSizeOuter(0)

  	svg2.append('g')
  		.attr("class", "x-axis2")
  		.attr('transform', 'translate(0,'+ (height - margin.bottom).toString()+')')
  		.call(xAxis2);


      /*
    	create y axis
    	make y scale
    	calculate the domin for the y axis
    	*/

    	var overallMaxD2 = d3.max(sum_levels)
    	var overallMinD2 = d3.min(sum_levels)

    	var y2 = d3.scaleLinear()
        	.domain([overallMinD2, overallMaxD2])
        	.range([height - margin.bottom, margin.top])

    	var yAxis2 = g => g
    		.attr('transform', 'translate('+(margin.left).toString() + ',0)')
    		.call(d3.axisLeft(y2))
    		.call(g => g.select(".domain").remove())
    		.call(g => g.select(".tick:last-of-type text").clone()
    			.attr("text-anchor", "start")
    			.style("font", "12px sans-serif")
    			.style('font-weight', 'bold')
    			.text('Water Depth'))

    	svg2.append('g')
    		.call(yAxis2);


        /*
      	making the dots
      	different dot functions for each type of statistic
      	*/

      	var cx2 = function(d){
      		return x2(d.date)
      	}

      	var cyMax = function(d){
      		return y2(d.max)
      	}

      	var cyMin = function(d){
      		return y2(d.min)
      	}

      	var cyAvg = function(d){
      		return y2(d.avg)
      	}

      	let dots2 = svg2.append('g')
      		.attr('class', 'dot2');


      	// put a text label with the current sensor

      	var label2 = svg2.append('g')
      		.attr("class", "label")
      		.attr('transform', 'translate('+(width-margin.right-60).toString()+','+ (height - margin.bottom-20).toString()+')')

      	label2.append("text")
      		.attr("class", "label")
      		.style("font", "12px sans-serif")
      		.style('font-weight', 'bold')
      		.attr("text-anchor", "middle");

      	label2.select("text").text('');


        // Highlight the sensor that is hovered
      	function handleMouseOver2(d) {

          	svg2.selectAll('.dot')
          		.style("opacity", 0.1)

          	let data2 = d3.select(this).data()

          	svg2.selectAll('.'+data2[0].pin)
          		.raise()
          		.style("opacity", 1.0);

          	label2.select("text").text(data2[0].des);

       		}

      	var doNotHighlight2 = function(){
      		svg2.selectAll(".dot")
      			.style("opacity", 1)

      		label2.select("text").text('');

      		}


          /*
        	make the time slider for RAW DATA PLOT
        	update the x axis range and redraw the dots to show only those in range
        	*/

        	var sliderRange = d3
        		.sliderBottom()
        		.min(overallMinT)
        		.max(overallMaxT)
        		.width(width)
        		.tickFormat(d3.timeFormat("%d-%b-%y"))
           		//.ticks(2)
        		.default([startTime, overallMaxT])
        		.fill('gray')
        		.on('onchange', val => {

        			x.domain([val[0], val[1]])

            		svg.select('.x-axis')
            			.call(xAxis);

            		for (var i=0; i<names.length; i++){

            			svg.selectAll('.'+names[i])
        					.attr("cx", function(d){
        						if (d.x < val[1] && d.x > val[0]) {
        							return cx(d)
        						}
        						else {
        							return null ;
        						}
        					})
        					.attr("cy", function(d){
        						if (d.x < val[1] && d.x > val[0]) {
        							return cy(d)
        						}
        						else {
        							return null ;
        						}
        					})
        			}

        		});

        	var gRange = d3
        		.select('div#slider-range')
        		.append('svg')
        		.attr('width', svgWidth)
        		.attr('height', 50)
        		.append('g')
         		.attr('transform', 'translate(' + margin.left +','+10+')');

        	  gRange.call(sliderRange);

                /*
              	make the time slider for STATS DATA PLOT
              	update the x axis range and redraw the dots to show only those in range
              	*/

              	var sliderRange2 = d3
              		.sliderBottom()
              		.min(overallMinT2)
              		.max(overallMaxT2)
              		.width(width)
              		//.ticks(7)
              		.tickFormat(d3.timeFormat("%d-%b-%y"))
              		.default([overallMinT2, overallMaxT2])
              		.fill('gray')
              		.on('onchange', val => {

              			x2.domain([val[0], val[1]])

                  		svg2.select('.x-axis2')
                  			.call(xAxis2);

                  		for (var i=0; i<names.length; i++){

                  			if (curSelection =='max'){
      							svg2.selectAll('.'+names[i])
      								.attr("cx", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cx2(d)
      									}
      									else {
      										return null ;
      									}
      								})
      								.attr("cy", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cyMax(d)
      									}
      									else {
      										return null ;
      									}
      								})
              				}

              				else if (curSelection =='min'){
      							svg2.selectAll('.'+names[i])
      								.attr("cx", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cx2(d)
      									}
      									else {
      										return null ;
      									}
      								})
      								.attr("cy", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cyMin(d)
      									}
      									else {
      										return null ;
      									}
      								})
              				}

              				else if (curSelection =='average'){
      							svg2.selectAll('.'+names[i])
      								.attr("cx", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cx2(d)
      									}
      									else {
      										return null ;
      									}
      								})
      								.attr("cy", function(d){
      									if (d.date < val[1] && d.date > val[0]) {
      										return cyAvg(d)
      									}
      									else {
      										return null ;
      									}
      								})
              				}

              			}

              		});

              	var gRange2 = d3
              		.select('div#slider-range2')
              		.append('svg')
              		.attr('width', svgWidth)
              		.attr('height', 50)
              		.append('g')
               		 .attr('transform', 'translate(' + margin.left +','+10+')');

              	  gRange2.call(sliderRange2);


            /*
          	making drop down menus for summary statistic
          	initially show maximum values for each day
          	*/

        	var curSelection = 'max'

        	var statsdropdownChange = function() {
                    curSelection = d3.select(this).property("value")
                    updateChecks();
                };

        	var statsdropdown = d3.select("#menu-2")
                    .insert("select", "svg")
                    .on("change", statsdropdownChange)
            		.attr("class", 'options2')

           var options = ['max','min', 'average']

            statsdropdown.selectAll("option")
                    .data(options)
                          .enter().append("option")
                            .attr("value", function (d) { return d; })
                            .text(function (d) {
                                return d;
                            });


            let sensor_groups = await $.get('/sensor_groupings');
            var group_pane = document.getElementById("group_select");
            group_names = Object.keys(sensor_groups)

            var group_button = document.createElement("button");
          	group_button.setAttribute("type", "button");
          	group_button.onclick = updateGroupChecks;
          	group_button.innerHTML = "Update Groups";
          	group_button.setAttribute('class', 'options')
          	group_pane.appendChild(group_button)

            for (name of group_names){
              var group = document.createElement("div");
              group_pane.append(group);
              var checkbox = document.createElement("input");
          		checkbox.setAttribute("type", "checkbox");
          		checkbox.setAttribute("name", name);
          		checkbox.setAttribute("value", "ff");
          		checkbox.setAttribute("id", name);
          		checkbox.checked = false;
          		checkbox.innerHTML = name;
              group.append(checkbox);

          		var text = document.createElement("label");
          		text.setAttribute('for', name )
          		text.setAttribute("id", name+'text');
          		text.innerHTML = name;

          		group.appendChild(text);
            }

            function updateGroupChecks(){
              checkedGroups = []
              for (name of group_names){
                var isGroupChecked = document.getElementById(name).checked;
                if (isGroupChecked){
                  checkedGroups.push(name);
                }
              }
              deselectAllUpdate();
              for (group of checkedGroups){
                //console.log(group);
                var curr_group = sensor_groups[group];
                //console.log(curr_group);
                for (sens of curr_group){
                  //console.log(sens);
                  var box = document.getElementById(sens);
                  box.checked=true;
                }
              }
              updateChecks();
            }







            /*
            create filter search bar
        	create checkboxes to select individual sensors with a label for its name
        	make each checkbox within its own div (row) so that they stack top to bottom
        	*/

        	var dropdown = document.getElementById("myDropdown");

        	var search = document.createElement('input')
        	search.setAttribute("type", "text");
        	search.onkeyup = searchBar
        	search.setAttribute('class', 'search')
        	search.setAttribute("id", 'search');
        	search.placeholder = "Search..."
        	dropdown.appendChild(search)

        	  for (var i=0; i<longNames.length; i++){

        		var row = document.createElement("div");

        		dropdown.appendChild(row)

        		var checkbox = document.createElement("input");
        		checkbox.setAttribute("type", "checkbox");
        		checkbox.setAttribute("name", longNames[i]);
        		checkbox.setAttribute("value", "ff");
        		checkbox.setAttribute("id", longNames[i]);
        		checkbox.checked = false;
        		checkbox.innerHTML = longNames[i];

        		row.appendChild(checkbox);

        		var text = document.createElement("label");
        		text.setAttribute('for',  longNames[i] )
        		text.setAttribute("id", longNames[i]+'text');
        		text.innerHTML = longNames[i];

        		row.appendChild(text);

        	}

        	/*
        	only show sensors whose name incluses the search bar input
        	*/

            function searchBar() {
        		var input = document.getElementById('search').value.toUpperCase();
        		for (var i = 0; i<longNames.length ; i++){
        			var name = longNames[i].toUpperCase()
        			if (name.includes(input)) {
        				var possibleSearch = document.getElementById(longNames[i])
        				possibleSearch.style.display=''
        				var possibleSearchText = document.getElementById(longNames[i]+'text')
        				possibleSearchText.style.display=''
        			}
        			else {
        				var notInSearch = document.getElementById(longNames[i])
        				notInSearch.style.display='none'
        				var possibleSearchText = document.getElementById(longNames[i]+'text')
        				possibleSearchText.style.display='none'
        			}
        		}

            }

        	/*
        	make select/deselect buttons
        	update the checked status of all the options
        	*/

        	var selectAll = document.createElement("button");
        	selectAll.setAttribute("type", "button");
        	selectAll.onclick = selectAllUpdate;
        	selectAll.innerHTML = "Select All";
        	selectAll.setAttribute('class', 'options')
        	dropdown.appendChild(selectAll)

            function selectAllUpdate(){
        		for (var i=0; i<longNames.length; i++){
        			var box = document.getElementById(longNames[i])
        			box.checked = true;
        		}
            }

            var deselectAll = document.createElement("button");
        	deselectAll.setAttribute("type", "button");
        	deselectAll.onclick = deselectAllUpdate;
        	deselectAll.innerHTML = "Deselect All";
        	deselectAll.setAttribute('class', 'options')
        	dropdown.appendChild(deselectAll)

            function deselectAllUpdate(){
        		for (var i=0; i<longNames.length; i++){
        			var box = document.getElementById(longNames[i])
        			box.checked = false;
        		}
            }

        	/*
        	make update button to redraw plots
        	*/

        	//var menu = document.getElementById("menu");

        	var button = document.createElement("button");
        	button.setAttribute("type", "button");
        	button.onclick = updateChecks;
        	button.innerHTML = "Update";
        	button.setAttribute('class', 'options')
        	myDropdown.appendChild(button)

        	/*
        	update the plots based on the user selections
        	get the data for the selected sensors
        	remove the old points from both plots
        	plot the data
        	get which summary statistic is selected and plot the according value
        	*/

          function updateChecks(){
        		checkedSensorsM = []
        		checkedSensorsS = []
        		for (var i=0; i<longNames.length; i++){
        			var isChecked = document.getElementById(longNames[i]).checked;
        			if (isChecked){

        				checkedSensorsM.push(longnames2data[longNames[i]])
        				checkedSensorsS.push(statsname2data[longNames[i]])

        			}
        		}

        		// update the raw data plot
        		for (var i=0; i<names.length; i++){
            			svg.selectAll('.'+names[i])
        					.remove()
        			}

				//console.log(checkedSensorsS)
				//console.log(checkedSensorsM)

                var rawDomain = x.domain()
				var statsDomain = x2.domain()

        		checkedSensorsM.forEach(function(d){

        			dots.selectAll('dot')
        			.data(d.pairs)
        			.enter()
        			.append("circle")
        			.attr("class", function (d) { return 'dot '+d.pin } )
        			  //.attr("cx", d => cx(d) )
        			  //.attr("cy", d => cy(d))
        			  .attr("cx", function(d){
        						if (d.x < rawDomain[1] && d.x > rawDomain[0]) {
        							return cx(d)
        						}
        						else {
        							return null ;
        						}
        					})
        					.attr("cy", function(d){
        						if (d.x < rawDomain[1] && d.x > rawDomain[0]) {
        							return cy(d)
        						}
        						else {
        							return null ;
        						}
        					})
        			  .attr("r", 2)
        			  .style("fill", function (d) { return intToRGB(hashCode(d.des)) } )
        			.on("mouseover", handleMouseOver)
        			.on("mouseleave", doNotHighlight)
        			});

        		// update the statistics plot

        		for (var i=0; i<names.length; i++){
            			svg2.selectAll('.'+names[i])
        					.remove()
        			}

        		stat = curSelection

        		if (stat =='max'){

        			checkedSensorsS.forEach(function(d){
        				dots2.selectAll('dot2')
        				.data(d.max)
        				.enter()
        				.append("circle")
        				.attr("class", function (d) { return 'dot '+d.pin } )
        				  //.attr("cx", d => cx2(d) )
        				  //.attr("cy", d => cyMax(d))
        				  .attr("cx", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cx2(d)
        						}
        						else {
        							return null ;
        						}
        					})
        					.attr("cy", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cyMax(d)
        						}
        						else {
        							return null ;
        						}
        					})
        				  .attr("r", 4)
        				  .style("fill", function (d) { return intToRGB(hashCode(d.des)) } )
        				.on("mouseover", handleMouseOver2)
        				.on("mouseleave", doNotHighlight2 )
        			});

        		}

        		else if (stat =='min'){

        			checkedSensorsS.forEach(function(d){
        				dots2.selectAll('dot2')
        				.data(d.min)
        				.enter()
        				.append("circle")
        				.attr("class", function (d) { return 'dot '+d.pin } )
        				  //.attr("cx", d => cx2(d) )
        				  //.attr("cy", d => cyMin(d))
        				  .attr("cx", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cx2(d)
        						}
        						else {
        							return null ;
        						}
        					})
        					.attr("cy", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cyMin(d)
        						}
        						else {
        							return null ;
        						}
        					})
        				  .attr("r", 4)
        				  .style("fill", function (d) { return intToRGB(hashCode(d.des)) } )
        				.on("mouseover", handleMouseOver2)
        				.on("mouseleave", doNotHighlight2 )
        			});

        		}

            else if (stat =='average'){

        			checkedSensorsS.forEach(function(d){
        				dots2.selectAll('dot2')
        				.data(d.avg)
        				.enter()
        				.append("circle")
        				.attr("class", function (d) { return 'dot '+d.pin } )
        				  //.attr("cx", d => cx2(d) )
        				  //.attr("cy", d => cyAvg(d))
        				  .attr("cx", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cx2(d)
        						}
        						else {
        							return null ;
        						}
        					})
        					.attr("cy", function(d){
        						if (d.date < statsDomain[1] && d.date > statsDomain[0]) {
        							return cyAvg(d)
        						}
        						else {
        							return null ;
        						}
        					})
        				  .attr("r", 4)
        				  .style("fill", function (d) { return intToRGB(hashCode(d.des)) } )
        				.on("mouseover", handleMouseOver2)
        				.on("mouseleave", doNotHighlight2 )
        			});
        		}

            updateOpacity();
        	}

          /*
          create leaflet map and add it to the divider
          create a circle for each sensor at its lat long
          */

          var mMap = L.map('mapid').setView([31.919138, -81.01524353], 10.5);

            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.light',
            accessToken: 'pk.eyJ1IjoibWNhcmxpbmk2IiwiYSI6ImNqd2h3ZW93cDAxaWo0M3A5bHFsb2l0NXIifQ.qiehHoOFMMN0VTrTg3_nDQ'
            }).addTo(mMap);

          var initOpacity = 0.3;
          var selOpacity = 1;
          var initRadius = 600;
          var selRadius = 800;
          var circles2data = [];

          for (sensor of dict){
                value = intToRGB(hashCode(sensor.name))
              var circle = L.circle([sensor.coords[1], sensor.coords[0]], {
              color: "#" + value ,
              fillColor: "#" + value,
              fillOpacity: initOpacity,
              radius: initRadius
            })
            circles2data.push([circle, sensor])
            circle.addTo(mMap);

            }

            circles2data.forEach(function(obj) {

              //obj[0].bindPopup('ID: '+obj[1].site_id);
              obj[0].on('mouseover', function (e) {
                  //this.openPopup();
                  info.update(obj[1]);
              });
              obj[0].on('mouseout', function (e) {
                  //this.closePopup();
                  info.update();
              });

              obj[0].on('click', function (e) {
                var box = document.getElementById(obj[1].name);
                if (box.checked == false){
                  box.checked = true;
                  updateChecks();
                }else{
                  box.checked=false;
                  updateChecks();
                }

            });

          });

          //console.log(circles2data);
          function updateOpacity(){
            for (circle_obj of circles2data){
              var circ_sens = circle_obj[1].name;
              var isCheckedCirc = document.getElementById(circ_sens).checked;
              if (isCheckedCirc){
                circle_obj[0].setStyle({fillOpacity: selOpacity});
                circle_obj[0].setRadius(selRadius);
                //console.log(circle_obj[0].options.radius);
              }else{
                circle_obj[0].setStyle({fillOpacity: initOpacity});
                circle_obj[0].setRadius(initRadius);
              }
            }
          }

            var info = L.control();

                info.onAdd = function (mMap) {
                    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
                    this.update();
                    return this._div;
                };

                info.update = function (sen) {
                    this._div.innerHTML = '<h4>Sensor Map</h4>' +  (sen ? sen.name : "Hover for name, click to plot");
                };

                info.addTo(mMap);





  });
}

//console.log("hello world");
main();
