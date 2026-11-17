/* Xuper Eclectic AAC Audio Continuity Clock v2.0.30
 * Normaliza marcas de tiempo PES AAC y rellena huecos breves con silencio sintético.
 */
(function(w){'use strict';
  var silent={1:[0x00,0xc8,0x00,0x80,0x23,0x80],2:[0x21,0x00,0x49,0x90,0x02,0x19,0x00,0x23,0x80]};
  var packed={3:'00c8008020840126400864008e',4:'00c80080208401264000802c80080238',5:'00c80080208401264000823004990021900238',6:'00c80080208401264000823004990021900200b2002008e0'};
  Object.keys(packed).forEach(function(k){
    var bytes=[];
    for(var i=0;i<packed[k].length;i+=2) bytes.push(parseInt(packed[k].slice(i,i+2),16));
    silent[k]=bytes;
  });
  function Clock(track){
    this.rate=track&&track.config&&track.config.sampleRate||48000;
    this.next=null;
    this.filled=0;
    this.dropped=0;
    var channels=track&&track.config&&track.config.channels||2;
    var buf=w.CactusBuffer||(window.CactusBuffer);
    this.silence=track&&track.codec==='mp4a.40.2'&&silent[channels]&&buf?buf.from(silent[channels]):null;
  }
  Clock.prototype.reset=function(){this.next=null;};
  Clock.prototype.init=function(track){
    var out={};
    if(track) Object.keys(track).forEach(function(k){out[k]=track[k];});
    out.timescale=this.rate;
    out.frameDuration=1024;
    return out;
  };
  Clock.prototype.segment=function(track,origin){
    var out=this.init(track),samples=[],step=1024,limit=this.rate*.5;
    origin=Number(origin)||0;
    for(var i=0;i<(track&&track.samples?track.samples.length:0);i++){
      var sample=track.samples[i];
      var at=Math.round(sample.dts*this.rate/90000);
      if(this.next===null)this.next=at;
      var delta=at-this.next;
      if(Math.abs(delta)>limit)this.next=at;
      else if(delta>step/2){
        if(this.silence){
          var count=Math.round(delta/step);
          for(var n=0;n<count;n++){
            samples.push({dts:this.next,pts:this.next,key:true,data:this.silence});
            this.next+=step;
            this.filled++;
          }
        }else this.next=at;
      }else if(delta< -step/2){
        this.dropped++;
        continue;
      }
      samples.push({dts:this.next,pts:this.next,key:sample.key,data:sample.data});
      this.next+=step;
    }
    out.samples=samples;
    return {
      track:out,
      base:samples.length?Math.max(0,Math.round(samples[0].dts-origin*this.rate/90000)):0
    };
  };
  w.CactusAudioClock=Clock;
})(window);
