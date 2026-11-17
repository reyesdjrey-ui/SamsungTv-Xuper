/* Small Uint8Array Buffer subset used by the user's original fmp4.js.
   Pure ES5 implementation for universal compatibility across all Tizen versions (3.0 - 10.0+). */
(function(w){'use strict';
  function BinaryBuffer(arg, byteOffset, length){
    var u;
    if(typeof arg==='number'){
      u=new Uint8Array(arg);
    }else if(arg instanceof ArrayBuffer){
      u=new Uint8Array(arg, byteOffset, length);
    }else if((typeof ArrayBuffer!=='undefined'&&typeof ArrayBuffer.isView==='function')?ArrayBuffer.isView(arg):(arg&&arg.buffer instanceof ArrayBuffer)){
      u=new Uint8Array(arg.buffer, arg.byteOffset + (byteOffset||0), length||arg.byteLength);
    }else if(Array.isArray(arg)){
      u=new Uint8Array(arg);
    }else if(arg){
      u=new Uint8Array(arg);
    }else{
      u=new Uint8Array(0);
    }
    if(Object.setPrototypeOf){
      Object.setPrototypeOf(u, BinaryBuffer.prototype);
    }else{
      u.__proto__ = BinaryBuffer.prototype;
    }
    return u;
  }
  BinaryBuffer.prototype=Object.create(Uint8Array.prototype);
  BinaryBuffer.prototype.constructor=BinaryBuffer;

  BinaryBuffer.alloc=function(n){return new BinaryBuffer(n);};
  BinaryBuffer.allocUnsafe=function(n){return new BinaryBuffer(n);};
  BinaryBuffer.from=function(input,encoding){
    if(typeof input==='string'){
      var a=new BinaryBuffer(input.length);
      for(var i=0;i<input.length;i++)a[i]=input.charCodeAt(i)&255;
      return a;
    }
    if(input instanceof ArrayBuffer)return new BinaryBuffer(input);
    var isV = (typeof ArrayBuffer.isView === 'function') ? ArrayBuffer.isView(input) : (input && input.buffer instanceof ArrayBuffer);
    if(isV)return new BinaryBuffer(input.buffer.slice(input.byteOffset,input.byteOffset+input.byteLength));
    return new BinaryBuffer(input);
  };
  BinaryBuffer.concat=function(chunks,size){
    if(size===undefined)size=chunks.reduce(function(n,c){return n+c.byteLength;},0);
    var out=new BinaryBuffer(size),index=0;
    chunks.forEach(function(c){if(index<out.length){out.set(c.subarray(0,out.length-index),index);index+=c.length;}});
    return out;
  };
  BinaryBuffer.prototype.writeUInt32BE=function(v,pos){new DataView(this.buffer,this.byteOffset,this.byteLength).setUint32(pos,v>>>0,false);return pos+4;};
  BinaryBuffer.prototype.writeUInt16BE=function(v,pos){new DataView(this.buffer,this.byteOffset,this.byteLength).setUint16(pos,v&65535,false);return pos+2;};
  BinaryBuffer.prototype.writeInt16BE=function(v,pos){new DataView(this.buffer,this.byteOffset,this.byteLength).setInt16(pos,v,false);return pos+2;};
  BinaryBuffer.prototype.writeInt32BE=function(v,pos){new DataView(this.buffer,this.byteOffset,this.byteLength).setInt32(pos,v,false);return pos+4;};
  BinaryBuffer.prototype.writeUIntBE=function(v,pos,len){for(var i=len-1;i>=0;i--){this[pos+i]=v&255;v=Math.floor(v/256);}return pos+len;};
  BinaryBuffer.prototype.write=function(str,pos,encoding){pos=pos||0;for(var i=0;i<str.length&&pos+i<this.length;i++)this[pos+i]=str.charCodeAt(i)&255;return Math.min(str.length,this.length-pos);};
  BinaryBuffer.prototype.toString=function(enc,start,end){start=start||0;end=end===undefined?this.length:end;var s='';for(var i=start;i<end;i++)s+=String.fromCharCode(this[i]);return s;};
  BinaryBuffer.prototype.subarray=function(begin,end){
    var sub=Uint8Array.prototype.subarray.call(this,begin,end);
    if(Object.setPrototypeOf){
      Object.setPrototypeOf(sub, BinaryBuffer.prototype);
    }else{
      sub.__proto__ = BinaryBuffer.prototype;
    }
    return sub;
  };

  w.CactusBuffer=BinaryBuffer;
})(window);
