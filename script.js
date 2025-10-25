// script.js — fireworks + letters + balloon animation + smooth transition
(function () {
  const canvas = document.getElementById('c');
  if (!canvas) throw new Error("Canvas element with id 'c' not found.");
  const ctx = canvas.getContext('2d');

  const opts = {
    strings: ["HAPPY", "BIRTHDAY"],   // text here
    charSize: 44,
    charSpacing: 62,
    lineHeight: 72,
    gravity: 0.12,
    upFlow: -0.06,
    fireworkPrevPoints: 12,
    fireworkBaseLineWidth: 6,
    fireworkAddedLineWidth: 8,
    fireworkSpawnTime: 140,
    fireworkBaseReachTime: 36,
    fireworkAddedReachTime: 40,
    fireworkCircleBaseSize: 22,
    fireworkCircleAddedSize: 14,
    fireworkCircleBaseTime: 36,
    fireworkCircleAddedTime: 26,
    fireworkCircleFadeBaseTime: 12,
    fireworkCircleFadeAddedTime: 8,
    fireworkBaseShards: 7,
    fireworkAddedShards: 8,
    fireworkShardPrevPoints: 3,
    fireworkShardBaseVel: 3.4,
    fireworkShardAddedVel: 2.6,
    fireworkShardBaseSize: 2,
    fireworkShardAddedSize: 3,
    letterContemplatingWaitTime: 260,
    balloonSpawnTime: 18,
    balloonBaseInflateTime: 12,
    balloonAddedInflateTime: 18,
    balloonBaseSize: 18,
    balloonAddedSize: 24,
    balloonBaseVel: 0.36,
    balloonAddedVel: 0.5,
    balloonBaseRadian: -(Math.PI / 2 - 0.4),
    balloonAddedRadian: -0.9
  };

  let DPR = Math.max(window.devicePixelRatio || 1, 1);
  let w = innerWidth, h = innerHeight, hw = w/2, hh = h/2;
  const Tau = Math.PI * 2;
  const letters = [];
  let calc = { totalWidth: 0 };

  function setSize() {
    DPR = Math.max(window.devicePixelRatio || 1, 1);
    const cssW = Math.max(1, innerWidth);
    const cssH = Math.max(1, innerHeight);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * DPR);
    canvas.height = Math.round(cssH * DPR);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(DPR, DPR);
    w = cssW; h = cssH; hw = w/2; hh = h/2;
    ctx.font = `${opts.charSize}px Verdana`;
    calc.totalWidth = opts.charSpacing * Math.max(...opts.strings.map(s => s.length));
  }

  function hueForX(x) {
    if (calc.totalWidth <= 0) return 40;
    const t = (x + calc.totalWidth/2) / calc.totalWidth;
    return 30 + 25 * Math.min(Math.max(t, 0), 1);
  }

  function Letter(char, x, y) {
    this.char = char;
    this.x = x; this.y = y;
    this.dx = -ctx.measureText(char).width / 2;
    this.dy = opts.charSize / 2;
    this.fireworkDy = this.y - hh;
    const hue = hueForX(x);
    this.hue = hue;
    this.color = `hsl(${hue},90%,50%)`;
    this.lightColor = (light) => `hsl(${hue},90%,${light}%)`;
    this.alphaColor = (alp) => `hsla(${hue},90%,52%,${alp})`;
    this.lightAlpha = (light, alp) => `hsla(${hue},90%,${light}%,${alp})`;
    this.reset();
  }

  Letter.prototype.reset = function() {
    this.phase = 'firework';
    this.tick = 0;
    this.spawned = false;
    this.spawningTime = Math.floor(opts.fireworkSpawnTime * Math.random());
    this.reachTime = Math.floor(opts.fireworkBaseReachTime + opts.fireworkAddedReachTime * Math.random());
    this.lineWidth = opts.fireworkBaseLineWidth + opts.fireworkAddedLineWidth * Math.random();
    this.prevPoints = [[0, hh, 0]];
  };

  // Shard class
  function Shard(x, y, vx, vy, color) {
    const vel = opts.fireworkShardBaseVel + opts.fireworkShardAddedVel * Math.random();
    this.vx = vx * vel; this.vy = vy * vel;
    this.x = x; this.y = y;
    this.prevPoints = [[x,y]];
    this.color = color;
    this.alive = true;
    this.size = opts.fireworkShardBaseSize + opts.fireworkShardAddedSize * Math.random();
  }

  Shard.prototype.step = function() {
    this.x += this.vx; this.y += (this.vy += opts.gravity);
    if (this.prevPoints.length > opts.fireworkShardPrevPoints) this.prevPoints.shift();
    this.prevPoints.push([this.x, this.y]);
    const lwp = this.size / Math.max(1, this.prevPoints.length);
    for (let k = 0; k < this.prevPoints.length - 1; ++k) {
      const p = this.prevPoints[k], p2 = this.prevPoints[k+1];
      ctx.strokeStyle = this.color;
      ctx.lineWidth = (k+1) * lwp * 0.6;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.stroke();
    }
    if (this.prevPoints[0][1] > hh + 60) this.alive = false;
  };

  function generateBalloonPath(ctx, x, y, size) {
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - size/2, y - size/2, x - size/4, y - size, x, y - size);
    ctx.bezierCurveTo(x + size/4, y - size, x + size/2, y - size/2, x, y);
  }

  function createLetters() {
    letters.length = 0;
    const rows = opts.strings.length;
    const longest = Math.max(...opts.strings.map(s => s.length));
    calc.totalWidth = opts.charSpacing * longest;
    const blockHeight = opts.lineHeight * rows;
    for (let i = 0; i < rows; ++i) {
      const str = opts.strings[i];
      const rowWidth = opts.charSpacing * str.length;
      const xOffset = -rowWidth / 2 + opts.charSpacing / 2;
      const y = i * opts.lineHeight + opts.lineHeight/2 - blockHeight/2;
      for (let j = 0; j < str.length; ++j) {
        letters.push(new Letter(str[j], xOffset + j * opts.charSpacing, y));
      }
    }
  }

  Letter.prototype.step = function() {
    const self = this;
    if (self.phase === 'firework') {
      if (!self.spawned) {
        self.tick++;
        if (self.tick >= self.spawningTime) { self.tick = 0; self.spawned = true; }
      } else {
        self.tick++;
        const lp = self.tick / Math.max(1, self.reachTime);
        const ap = Math.sin(lp * (Tau / 4));
        const x = lp * self.x;
        const y = hh + ap * self.fireworkDy;
        if (self.prevPoints.length > opts.fireworkPrevPoints) self.prevPoints.shift();
        self.prevPoints.push([x, y, lp * self.lineWidth]);
        const lwp = 1 / Math.max(1, self.prevPoints.length - 1);
        for (let i = 1; i < self.prevPoints.length; ++i) {
          const p = self.prevPoints[i], p2 = self.prevPoints[i - 1];
          ctx.strokeStyle = self.alphaColor((i / self.prevPoints.length) * 0.9);
          ctx.lineWidth = p[2] * lwp * i;
          ctx.beginPath();
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.stroke();
        }
        if (self.tick >= self.reachTime) {
          self.phase = 'contemplate';
          self.circleFinalSize = opts.fireworkCircleBaseSize + opts.fireworkCircleAddedSize * Math.random();
          self.circleCompleteTime = Math.floor(opts.fireworkCircleBaseTime + opts.fireworkCircleAddedTime * Math.random());
          self.circleCreating = true; self.circleFading = false;
          self.circleFadeTime = Math.floor(opts.fireworkCircleFadeBaseTime + opts.fireworkCircleFadeAddedTime * Math.random());
          self.tick = 0; self.tick2 = 0;
          self.shards = [];
          const shardCount = Math.max(5, Math.floor(opts.fireworkBaseShards + opts.fireworkAddedShards * Math.random()));
          const angle = (Tau / shardCount);
          let cos = Math.cos(angle), sin = Math.sin(angle);
          let vx = 1, vy = 0;
          for (let i = 0; i < shardCount; ++i) {
            const vx1 = vx;
            vx = vx * cos - vy * sin;
            vy = vx1 * sin + vy * cos;
            self.shards.push(new Shard(self.x, self.y, vx, vy, self.alphaColor(1)));
          }
        }
      }
    } else if (self.phase === 'contemplate') {
      self.tick++;
      if (self.circleCreating) {
        self.tick2++;
        const prop = self.tick2 / Math.max(1, self.circleCompleteTime);
        const armonic = -Math.cos(prop * Math.PI)/2 + 0.5;
        ctx.beginPath();
        ctx.fillStyle = self.lightAlpha(40 + 60 * prop, prop);
        ctx.arc(self.x, self.y, armonic * self.circleFinalSize, 0, Tau);
        ctx.fill();
        if (self.tick2 > self.circleCompleteTime) { self.tick2 = 0; self.circleCreating = false; self.circleFading = true; }
      } else if (self.circleFading) {
        ctx.save();
        ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(255,200,110,0.9)';
        ctx.fillStyle = self.lightColor(76); ctx.fillText(self.char, self.x+self.dx, self.y+self.dy);
        ctx.restore();
        self.tick2++;
        const prop = self.tick2 / Math.max(1, self.circleFadeTime);
        const armonic = -Math.cos(prop*Math.PI)/2 + 0.5;
        ctx.beginPath(); ctx.fillStyle = self.lightAlpha(100,1-armonic); ctx.arc(self.x,self.y,self.circleFinalSize,0,Tau); ctx.fill();
        if(self.tick2>=self.circleFadeTime) self.circleFading=false;
      } else {
        ctx.save(); ctx.shadowBlur=10; ctx.shadowColor='rgba(255,190,80,0.85)';
        ctx.fillStyle=self.lightColor(72); ctx.fillText(self.char,self.x+self.dx,self.y+self.dy); ctx.restore();
      }
      for(let i=0;i<self.shards.length;i++){self.shards[i].step(); if(!self.shards[i].alive){self.shards.splice(i,1); i--;}}
      if(self.tick>opts.letterContemplatingWaitTime){
        self.phase='balloon'; self.tick=0; self.spawning=true;
        self.spawnTime=Math.floor(opts.balloonSpawnTime*Math.random());
        self.inflating=false;
        self.inflateTime=Math.floor(opts.balloonBaseInflateTime+opts.balloonAddedInflateTime*Math.random());
        self.size=Math.floor(opts.balloonBaseSize+opts.balloonAddedSize*Math.random());
        const rad=opts.balloonBaseRadian+opts.balloonAddedRadian*Math.random();
        const vel=opts.balloonBaseVel+opts.balloonAddedVel*Math.random();
        self.vx=Math.cos(rad)*vel; self.vy=Math.sin(rad)*vel;
        self.cx=self.x; self.cy=self.y;
      }
    } else if(self.phase==='balloon'){
      ctx.strokeStyle=self.lightColor(82); ctx.lineWidth=1.2;
      if(self.spawning){self.tick++; ctx.fillStyle=self.lightColor(72); ctx.fillText(self.char,self.x+self.dx,self.y+self.dy); if(self.tick>=self.spawnTime){self.tick=0; self.spawning=false; self.inflating=true;}}
      else if(self.inflating){self.tick++; const prop=self.tick/Math.max(1,self.inflateTime); const x=(self.cx=self.x); const y=(self.cy=self.y-self.size*prop); ctx.fillStyle=self.alphaColor(prop*0.9); ctx.beginPath(); generateBalloonPath(ctx,x,y,self.size*prop); ctx.fill(); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,self.y); ctx.stroke(); ctx.fillStyle=self.lightColor(70); ctx.fillText(self.char,self.x+self.dx,self.y+self.dy); if(self.tick>=self.inflateTime){self.tick=0; self.inflating=false;}}
      else {self.cx+=self.vx; self.cy+=(self.vy+=opts.upFlow); ctx.fillStyle=self.color; ctx.beginPath(); generateBalloonPath(ctx,self.cx,self.cy,self.size); ctx.fill(); ctx.beginPath(); ctx.moveTo(self.cx,self.cy); ctx.lineTo(self.cx,self.cy+self.size); ctx.stroke(); ctx.fillStyle=self.lightColor(76); ctx.fillText(self.char,self.cx+self.dx,self.cy+self.dy+self.size); if(self.cy+self.size<-hh-120 || self.cx<-hw-120 || self.cx>hw+120) self.phase='done';}}
  };

  let secondAnimationStarted=false;
  function startSecondAnimation(){window.location.href="index2.html";}

  function animate() {
    window.requestAnimationFrame(animate);

    ctx.save(); ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#0c0610'; ctx.fillRect(0,0,canvas.width/DPR,canvas.height/DPR);
    const g=ctx.createRadialGradient(hw,hh,0,hw,hh,Math.max(w,h)*0.9);
    g.addColorStop(0,'rgba(255,190,80,0.06)'); g.addColorStop(0.25,'rgba(255,160,60,0.03)'); g.addColorStop(1,'rgba(0,0,0,0.6)');
    ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width/DPR,canvas.height/DPR);
    ctx.restore();

    ctx.save(); ctx.translate(hw, hh); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.font=`${opts.charSize}px Verdana`;
    let allDone=true;
    for(let i=0;i<letters.length;i++){letters[i].step(); if(letters[i].phase!=='done') allDone=false;}
    ctx.restore();

    if(allDone && !secondAnimationStarted){ secondAnimationStarted=true; letters.length=0; setTimeout(startSecondAnimation,500);}
  }

  setSize(); createLetters(); animate();
  window.addEventListener('resize',()=>{window.requestAnimationFrame(()=>{setSize(); createLetters();});},{passive:true});
})();
