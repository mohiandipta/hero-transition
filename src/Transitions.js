import React, { Component, Fragment } from "react";
import * as THREE from "three";
import { TimelineMax } from "gsap";
import { fragment } from "./fragmentValue";
import { withRouter } from "react-router-dom";
class Transition extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
      paused: true,
      textures: [],
      fragmentValue: fragment,
      current: 0,
      isRunning: false
    };
  }
  componentDidMount() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.vertex = `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`;
    this.fragment = this.state.fragmentValue;
    this.uniforms = {
      width: { value: 0.5, type: "f", min: 0, max: 10 },
      scaleX: { value: 40, type: "f", min: 0.1, max: 60 },
      scaleY: { value: 40, type: "f", min: 0.1, max: 60 }
    };
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.duration = 1;
    this.debug = false;
    this.easing = "easeInOut";
    this.container = document.getElementById("slider");
    this.images = JSON.parse(this.container.getAttribute("data-images"));
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 2);

    this.initiate(() => {
      console.log(this.state.textures);
      this.setupResize();
      this.settings();
      this.addObjects();
      this.resize();
      this.clickEvent();
      this.play();
    });
  }

  initiate = cb => {
    const promises = [];
    let that = this;
    this.images.forEach((url, i) => {
      console.log(url);
      let promise = new Promise(resolve => {
        console.log(that.state.textures);
        that.state.textures[i] = new THREE.TextureLoader().load(url, resolve);

        that.state.textures[i].name = url.substring(0, url.length - 4);
      });

      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      cb();
    });
  };

  setupResize = () => {
    window.addEventListener("resize", this.resize);
  };
  settings = () => {
    let that = this;
    // this.settings = { progress: 0.5 };
    console.log("settings");
    Object.keys(this.uniforms).forEach(item => {
      this.settings[item] = this.uniforms[item].value;
      if (this.debug)
        this.gui.add(
          this.settings,
          item,
          this.uniforms[item].min,
          this.uniforms[item].max,
          0.01
        );
    });
  };
  addObjects = () => {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        progress: { type: "f", value: 0 },
        border: { type: "f", value: 0 },
        intensity: { type: "f", value: 0 },
        scaleX: { type: "f", value: 40 },
        scaleY: { type: "f", value: 40 },
        transition: { type: "f", value: 40 },
        swipe: { type: "f", value: 0 },
        width: { type: "f", value: 0 },
        radius: { type: "f", value: 0 },
        texture1: { type: "f", value: this.state.textures[0] },
        texture2: { type: "f", value: this.state.textures[1] },
        displacement: {
          type: "f",
          value: new THREE.TextureLoader().load("img/disp1.jpg")
        },
        resolution: { type: "v4", value: new THREE.Vector4() }
      },
      // wireframe: true,
      vertexShader: this.vertex,
      fragmentShader: this.fragment
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 2, 2);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  };
  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    // image cover
    this.imageAspect =
      this.state.textures[0].image.height / this.state.textures[0].image.width;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

    this.plane.scale.x = this.camera.aspect;
    this.plane.scale.y = 1;

    this.camera.updateProjectionMatrix();
  };
  clickEvent = () => {
    this.props.history.listen((location, action) => {
      let nextPath;
      if (location.pathname === "/") {
        nextPath = "home";
        this.next(nextPath);
        return;
      } else {
        nextPath = location.pathname.slice(1);
        this.next(nextPath);
        return;
      }
    });
  };

  stop = () => {
    this.setState({
      paused: true
    });
  };

  play = () => {
    this.setState({
      paused: false
    });
    this.renderTransition();
  };

  next = nextRoute => {
    if (this.state.isRunning) return;
    this.setState({
      isRunning: true
    });
    let len = this.state.textures.length;
    let nextRouteIndex = this.state.textures.findIndex(
      img => img.name === nextRoute
    );

    let nextTexture = this.state.textures[nextRouteIndex % len];
    console.log("nextTexture");
    console.log(nextTexture);
    this.material.uniforms.texture2.value = nextTexture;
    let tl = new TimelineMax();
    tl.to(this.material.uniforms.progress, this.duration, {
      value: 1,
      ease: "easeOut",
      onComplete: () => {
        console.log("FINISH");
        this.setState({
          current: nextRouteIndex % len
        });
        this.material.uniforms.texture1.value = nextTexture;
        this.material.uniforms.progress.value = 0;
        this.setState({
          isRunning: false
        });
      }
    });
  };

  renderTransition = () => {
    if (this.state.paused) return;
    let _time = this.state.time;
    _time += 0.05;
    this.setState({
      time: _time
    });
    this.material.uniforms.time.value = this.time;

    Object.keys(this.uniforms).forEach(item => {
      this.material.uniforms[item].value = this.settings[item];
    });

    requestAnimationFrame(this.renderTransition.bind(this));
    this.renderer.render(this.scene, this.camera);
  };
  render() {
    return (
      <Fragment>
        <main>
          <div className="frame" />
          <div id="content" className="content">
            <div
              id="slider"
              data-images='["one.jpg","about.jpg","contact.jpg"]'
              data-displacement=""
            />
          </div>
        </main>
      </Fragment>
    );
  }
}

export default withRouter(Transition);
