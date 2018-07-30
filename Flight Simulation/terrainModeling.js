/**
 * @author Manhua Wu <mwu39@illinois.edu>
 */

/** 
 * returns vArray, fArray and nArray
 * stores each vertex to vArray. Then using terrain.generate() to calculate height of each vertex.
 *  calculate fArray and calculate normal for each face.
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vArray, fArray, nArray){
  // store all vertex in vertexArray
  var numT=0;
  var deltaX = (maxX-minX)/n;
  var deltaY = (maxY-minY)/n;
  for(var i=0; i<=n; i++){
    for(var j = 0; j<=n; j++){
      vArray.push(minX+deltaX*j);
      vArray.push(minY+deltaY*i);
      vArray.push(0);
    }
  }
  // calculate height for vertex with terrain.generate() function.
  var terrain = new Terrain(n+1, 0.2);  // 0.1 is roughness.
  terrain.generate();
    
  for(var x=0; x<=n; x++){
    for(var y=0; y<=n; y++){
      vArray[(x*(n+1)+y)*3+2] = 0.03 * terrain.get(x,y); // for each vertex, get height.
    }
  }

  // push face to fArray
  for(var i=0; i<n; i++){
    for(var j=0; j<n; j++){
      var vid = i*(n+1) + j;
      fArray.push(vid);
      fArray.push(vid+1);
      fArray.push(vid+n+1);
           
      fArray.push(vid+1);
      fArray.push(vid+1+n+1);
      fArray.push(vid+n+1);
      numT += 2;
    }
  }

  // calculate normal array for each face.
  for(var x=0; x<=n; x++){
    for(var y=0; y<=n; y++){
      // find three vertex for each face
      var v1 = vec3.fromValues(vArray[(x*(n+1)+y)*3], vArray[(x*(n+1)+y)*3+1], vArray[(x*(n+1)+y)*3+2]);
      var v2 = vec3.fromValues(vArray[((x+1)*(n+1)+y)*3], vArray[((x+1)*(n+1)+y)*3+1], vArray[((x+1)*(n+1)+y)*3+2]);
      var v3 = vec3.fromValues(vArray[(x*(n+1)+y+1)*3], vArray[(x*(n+1)+y+1)*3+1], vArray[(x*(n+1)+y+1)*3+2]);
        
      // declare edge and normal vector
      var edge1 = vec3.create();
      var edge2 = vec3.create();
      var normal = vec3.create();
        
      // calculate two edge vector, and cross product those to get normal.
      vec3.subtract(edge1, v1, v2);
      vec3.subtract(edge2, v3, v2);
      vec3.cross(normal, edge1, edge2);
      vec3.normalize(normal, normal);
      
        // push result to nArray.
      nArray.push(normal[0]);
      nArray.push(normal[1]);
      nArray.push(normal[2]);
    }
  }
  return numT;
}

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
function generateLinesFromIndexedTriangles(fArray,lArray)
{
    numTri = fArray.length/3;
    for(var f=0; f<numTri; f++)
    {
        var fid = f*3;
        lArray.push(fArray[fid]);
        lArray.push(fArray[fid+1]);
        
        lArray.push(fArray[fid+1]);
        lArray.push(fArray[fid+2]);
        
        lArray.push(fArray[fid+2]);
        lArray.push(fArray[fid]);
    }
}

//-------------------------------------------------------------------------


/*
 * Returns a map, which is 1D array for each (x,y) location.
 * Input: length, roughness
 */
function Terrain(length, roughness) {
  this.size = length;
  this.map = new Float32Array(this.size * this.size);
  this.roughness = roughness;
}


/* 
 * returns the map with the square and diamond with recursion.
 */
Terrain.prototype.divide = function(size){
    var x;
    var y;
    var half = size/2;
    // return if vertex all set.
    if (half < 1)
        return;
    
    // square: calculate the middle point by calling this.square(). 
    for(y = half; y < this.size - 1; y += size){
        for(x = half; x < this.size - 1; x += size){
            // call this.average() and get average value of four corner.
            var avg = this.average([
                this.get(x - half, y - half),   // upper left
                this.get(x + half, y - half),   // upper right
                this.get(x + half, y + half),   // lower right
                this.get(x - half, y + half)    // lower left
            ]);

            // set the height for (x,y)
        this.map[x + y * this.size] = avg + ((Math.random()-0.5) * this.roughness * size);
        }
    }
    
    // diamond: calculate the four diamonds 
    for(y = 0; y < this.size - 1; y += half){
        for(x= (y + half) % size; x < this.size - 1; x += size){
            // call this.average() and get average value of four middle point.
            var avg = this.average([
                this.get(x, y - half),      // top
                this.get(x + half, y),      // right
                this.get(x, y + half),      // bottom
                this.get(x - half, y)       // left
            ]);

            // set the height for (x,y)
            this.map[x + y * this.size] = avg + (Math.random()-0.5) * this.roughness * size;
        }
    }
    // call function itself with size/2
    this.divide(size/2);
};


/* 
 *  gets the height for location (x,y) using x and y coordinates.
 */
Terrain.prototype.get = function(x,y) {
    if (x >= 0 && y >= 0 && x <= this.size - 1 && y <= this.size - 1)
        return this.map[x + y * this.size];
    return -1;
};


/* 
 *  calculates the average of values that not equal to -1.
 */
Terrain.prototype.average = function(values) {
    // filter the value that beyond boundary.
    var valid = values.filter(function(val) { return val !== -1; });
    // calculate sum
    var total = valid.reduce(function(sum, val) { return sum + val; }, 0);
    // get average number.
    return total / valid.length;
};

/*
 * generates the vertices for the corners
 */
Terrain.prototype.generate = function() {
    // set value for four start corner
    var cornHeight = 0;
    
    this.map[0 + 0 * this.size] = cornHeight;
    this.map[this.size - 1 + 0 * this.size] = cornHeight;
    this.map[this.size - 1 + this.size - 1 * this.size] = cornHeight;
    this.map[0 + this.size - 1 * this.size] = cornHeight;
    
    // call divide function to calcualte height for each point.
    this.divide(this.size - 1);
};


