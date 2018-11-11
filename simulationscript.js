
SIMULATION = {};

METERS = 100.0; // how many length units in the renderer make 1 meter
AU = 1.495979e11 * METERS; // how many meters make one Astronomical Unit

EARTH_RADIUS = 6371000 * METERS;
AREA_OF_SAIL = 10 * METERS**2.0; // in m^2

SPEED_OF_LIGHT = 3e8 * METERS; // extra factor of meters since units of speed of light is ms^-1

LASER_POWER = 50e9 * METERS**2; // 50 Giga Watts

/* updates the simulation state */
function update () {  
    update_simulation_state();
    render_scene();
    requestAnimationFrame(update);
}

function update_simulation_state()
{
/*    var pos = transversal_position(SIMULATION.time);
    var vel = transversal_velocity(SIMULATION.time);
    var ang = angle(SIMULATION.time);
    var angvel = angular_velocity(SIMULATION.time);
  */  

    update_euler();
    
    if (SIMULATION.logcount > 0){
	SIMULATION.logcount --;
	var logtext = "";
	logtext += String(200 - SIMULATION.logcount) + " \t ";
	logtext += String(round_to(SIMULATION.time, 2)) + " \t ";
	logtext += String(round_to(SIMULATION.sailPosition[2]/METERS, 5)) + " \t ";
	logtext += String(round_to(SIMULATION.sailPosition[1]/METERS, 5)) + " \t ";
	logtext += String(round_to(SIMULATION.sailAngle[2], 3)) + " \t ";
	logtext += String(round_to(SIMULATION.sailAngle[1], 3));
	log_in_box(logtext);
    }
    
    SIMULATION.time += SIMULATION.DeltaT;
}

function round_to(val, decimalplaces)
{
    return Math.round(val* (10**decimalplaces))/(10**decimalplaces);
}

/* positions all the objects according to their state and renders the scene */
function render_scene()
{
    SIMULATION.sphereSail.position.set(SIMULATION.sailPosition[0] + SIMULATION.sphericalSailCutoffDistance*SIMULATION.radiusScaleFactor,
				SIMULATION.sailPosition[1],
				SIMULATION.sailPosition[2]);

    
    var n = [
	Math.cos(SIMULATION.sailAngle[2]) * Math.cos(SIMULATION.sailAngle[1]),
	Math.sin(SIMULATION.sailAngle[2]) * Math.cos(SIMULATION.sailAngle[1]),
	Math.sin(SIMULATION.sailAngle[1])
    ];
    
    SIMULATION.cutoffPlaneNormal = new THREE.Vector3(n[0], n[1], n[2]);

    var d = $V(n).dot($V(SIMULATION.sailPosition));
    
    SIMULATION.sphericalSailCutoffPlane.set(SIMULATION.cutoffPlaneNormal, -d);
	
    SIMULATION.renderer.render(SIMULATION.scene, SIMULATION.camera);
}

function randint(a, b)
{
    return Math.floor(Math.random()*(b-a) + a);
}

SIMULATION.period = 2;
SIMULATION.squareLength = 300;

function length(x, y)
{
    return Math.sqrt(x*x + y*y);
}

function update_euler()
{
    var L_c = SIMULATION.centerOfMass; // center of mass
    var L = L_c*2; // distance of chip from ship
    var w_0 = LASER_POWER/AREA_OF_SAIL/SPEED_OF_LIGHT;  // power flux divided by the speed of light
    var a = SIMULATION.radiusScaleFactor*Math.sin(SIMULATION.sphericalSaleSolidAngle/2.0)*SIMULATION.sphericalSailRadius0; // distance form axis to rim
    var m = SIMULATION.totalMass; // mass of the nanocraft
    var I = m*L*L/4.0; // moment of inertial x and y components
    var I_3 = m*a*a/2; // moment of inertial z component

    var F_rad = 2 * w_0 * Math.PI * a * a;

    var R = SIMULATION.sphericalSailRadius0 * SIMULATION.radiusScaleFactor;
    
    var X = SIMULATION.sailPosition[2];
    var Y = SIMULATION.sailPosition[1];
    var theta_x = SIMULATION.sailAngle[2];
    var theta_y = SIMULATION.sailAngle[1];
    var omega_x = SIMULATION.sailAngularVelocity[2];
    var omega_y = SIMULATION.sailAngularVelocity[1];

    var omega_z = SIMULATION.omegaX; // X and Z axes are reversed in the simulation
    
    var ddomega_y = -((I_3 - I)*omega_x*omega_z - 0.5 * F_rad*(X + L_c*theta_y) + 0.5 * F_rad * L_c/R*(X + L_c*theta_y))/I;
    var ddomega_x = -((I - I_3)*omega_y*omega_z - 0.5 * F_rad*(Y + L_c*theta_x) + 0.5 * F_rad * L_c/R*(Y + L_c*theta_x))/I;
    var ddX = (F_rad*theta_y - 0.5 * F_rad/R * (X + L_c*theta_y))/m;
    var ddY = (F_rad*theta_x - 0.5 * F_rad/R * (Y + L_c*theta_x))/m;

    SIMULATION.sailAngularVelocity[2] += SIMULATION.DeltaT * ddomega_x;
    SIMULATION.sailAngularVelocity[1] += SIMULATION.DeltaT * ddomega_y;
    
    SIMULATION.sailVelocity[2] += SIMULATION.DeltaT * ddX;
    SIMULATION.sailVelocity[1] += SIMULATION.DeltaT * ddY;

    SIMULATION.sailPosition[2] += SIMULATION.DeltaT * SIMULATION.sailVelocity[2];
    SIMULATION.sailPosition[1] += SIMULATION.DeltaT * SIMULATION.sailVelocity[1];

    SIMULATION.sailAngle[2] += SIMULATION.DeltaT * SIMULATION.sailAngularVelocity[2];
    SIMULATION.sailAngle[1] += SIMULATION.DeltaT * SIMULATION.sailAngularVelocity[1];
    
}

function transversal_position(time)
{
    return $V([0.1*Math.sin(time*1000)*METERS, 0.1*Math.sin(time*100)*METERS]);
}

function transversal_velocity(time)
{
    return $V([0, 0]);
}

function angle(time)
{
    return $V([0, Math.cos(time*100)*0.1, Math.sin(time*100)*0.1]);
}

function angular_velocity(time)
{
    return $V([0, 0, 0]);
}


function reset_parameters()
{
    SIMULATION.time = 0;

    SIMULATION.sailPosition = [0.0, 0.0, 0.0];
    SIMULATION.sailVelocity = [0.0, 0.0, 0.0];
    SIMULATION.sailAngle = [0.0, 0.0, 0.0];
    SIMULATION.sailAngularVelocity = [0.0, 0.0, 0.0];
    
    SIMULATION.scene = null;
    SIMULATION.scene = new THREE.Scene();

    SIMULATION.scene.add(SIMULATION.camera);
    SIMULATION.scene.add(SIMULATION.pointLight);
    SIMULATION.scene.add(SIMULATION.ambientLight);

    SIMULATION.scene.add(SIMULATION.skyBox);

    // for debugging purposes
    // SIMULATION.scene.add(SIMULATION.cutoffPlaneObject);    
    
    SIMULATION.scene.add(SIMULATION.earthObject);
    SIMULATION.scene.add(SIMULATION.sunObject);

    SIMULATION.scene.add(SIMULATION.laserBeamObject);   
    
    var helper = new THREE.GridHelper( 1200, 60, 0xFF4444, 0x404040 );
    helper.scale.set(1.0, 1.0, 1.0);
    
    SIMULATION.scene.add(helper);

    SIMULATION.scene.add(SIMULATION.sphereSail);
}

/* initializes some parameters and variables for the simulation */
function init()
{    
    SIMULATION.time = 0;

    SIMULATION.radiusScaleFactor = 1.0;
    SIMULATION.sphericalSailCutoffDistance = 0.0;
    SIMULATION.sphericalSailRadius0 = Math.sqrt(20/(4*Math.PI)) * METERS;

    SIMULATION.sailPosition = [0.0, 0.0, 0.0];
    SIMULATION.sailVelocity = [0.0, 0.0, 0.0];
    SIMULATION.sailAngle = [0.0, 0.0, 0.0];
    SIMULATION.sailAngularVelocity = [0.0, 0.0, 0.0];
    
    onchange_solidangle();
    onchange_timestep();
    onchange_mass();
    onchange_com();
    onchange_omegax();
    
    SIMULATION.viewWidth = 800;
    SIMULATION.viewHeight = 600;

    SIMULATION.renderer = new THREE.WebGLRenderer();
    // for manipulating the geometry/curvature of the spherical sail model
    SIMULATION.renderer.localClippingEnabled = true;

    SIMULATION.camera = new THREE.PerspectiveCamera(20, SIMULATION.viewWidth/SIMULATION.viewHeight, 0.1, 1e15);
    SIMULATION.camera.position.set(0,0,1500);
    SIMULATION.camera.lookAt(new THREE.Vector3(0,0,0));
    
    SIMULATION.renderer.setSize(SIMULATION.viewWidth, SIMULATION.viewHeight);
    
    $("#container").append(SIMULATION.renderer.domElement);

    SIMULATION.controls = new THREE.OrbitControls(SIMULATION.camera, SIMULATION.renderer.domElement);    

    // skybox
    SIMULATION.skyTextureList = [
      THREE.ImageUtils.loadTexture("res/xpos.png"),
      THREE.ImageUtils.loadTexture("res/xneg.png"),
      THREE.ImageUtils.loadTexture("res/ypos.png"),
      THREE.ImageUtils.loadTexture("res/yneg.png"),
      THREE.ImageUtils.loadTexture("res/zpos.png"),
      THREE.ImageUtils.loadTexture("res/zneg.png")
    ];
    
    SIMULATION.skyMaterialArray = [];
    for (var i = 0; i < 6; i++)
	SIMULATION.skyMaterialArray.push( new THREE.MeshBasicMaterial({
	    map: SIMULATION.skyTextureList[i],
	    side: THREE.BackSide
    }));
    
    SIMULATION.skyGeometry = new THREE.CubeGeometry( 5e14, 5e14, 5e14 );
    SIMULATION.skyMaterial = new THREE.MeshFaceMaterial( SIMULATION.skyMaterialArray );
    SIMULATION.skyBox = new THREE.Mesh(SIMULATION.skyGeometry, SIMULATION.skyMaterial );
    SIMULATION.skyBox.rotation.x += Math.PI / 2;
    
    
    // "light source", coming from direction of the sun (but should not be as far)
    SIMULATION.pointLight = new THREE.PointLight(0xAAAAAA);
    SIMULATION.ambientLight = new THREE.AmbientLight(0x777777);
    SIMULATION.pointLight.position.x = 1000;
    SIMULATION.pointLight.position.y = 0;
    SIMULATION.pointLight.position.z = 1000;

    SIMULATION.objLoader = new THREE.OBJLoader();

    // initialize variables for models objects
    SIMULATION.sphericalSailCutoffPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), SIMULATION.sphericalSailCutoffDistance);
    SIMULATION.cutoffPlaneGometry = new THREE.PlaneGeometry(3*METERS, 3*METERS, 1, 1);
    SIMULATION.cutoffPlaneMaterial = new THREE.MeshBasicMaterial({color: 0xFFFF00, side: THREE.DoubleSide});
    SIMULATION.cutoffPlaneObject = new THREE.Mesh(SIMULATION.cutoffPlaneGometry, SIMULATION.cutoffPlaneMaterial);
    SIMULATION.cutoffPlaneObject.rotateY(Math.PI/2); 

    var laserDistance = 10*METERS*METERS*METERS; // this choice was arbitrary
    SIMULATION.laserBeamGeometry = new THREE.CylinderGeometry(SIMULATION.sphericalSailRadius0, SIMULATION.sphericalSailRadius0, laserDistance, 20, 1, true );
    
    SIMULATION.laserBeamMaterial = new THREE.MeshBasicMaterial({color: 0xFF0000,  side: THREE.DoubleSide, transparent: true, opacity: 0.15});
    SIMULATION.laserBeamObject = new THREE.Mesh(SIMULATION.laserBeamGeometry, SIMULATION.laserBeamMaterial);
    SIMULATION.laserBeamObject.rotateZ(Math.PI/2.0);
    SIMULATION.laserBeamObject.scale.x = 1.0/Math.sin(SIMULATION.sphericalSaleSolidAngle/2.0);
    SIMULATION.laserBeamObject.scale.z = 1.0/Math.sin(SIMULATION.sphericalSaleSolidAngle/2.0);
    SIMULATION.laserBeamObject.position.x = -laserDistance/2.0;
    
    
    SIMULATION.sphereMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF, side: THREE.DoubleSide,
							clippingPlanes: [ SIMULATION.sphericalSailCutoffPlane ]
						       });
    SIMULATION.sphereGeometry = new THREE.SphereGeometry(SIMULATION.sphericalSailRadius0,50,50);
    SIMULATION.sphereSail = new THREE.Mesh(SIMULATION.sphereGeometry, SIMULATION.sphereMaterial);
    
    SIMULATION.sunMaterial = new THREE.MeshLambertMaterial({color: 0xFFFF00});
    
    // sun has radius of about 1/215th the  away
    SIMULATION.sunSphere = new THREE.SphereGeometry(AU/215.0,10,10);

    // sun is about 1 AU away
    SIMULATION.sunObject = new THREE.Mesh(SIMULATION.sunSphere, SIMULATION.sunMaterial);
    
    SIMULATION.sunObject.position.x = 0.707 * AU;
    SIMULATION.sunObject.position.y = 0;
    SIMULATION.sunObject.position.z = 0.707 * AU;
    
    //SIMULATION.earthMaterial = new THREE.MeshLambertMaterial({color: 0x0000FF});
    SIMULATION.earthTexture = THREE.ImageUtils.loadTexture('res/earth.png');
    SIMULATION.earthMaterial = new THREE.MeshLambertMaterial({map: SIMULATION.earthTexture});
    
    SIMULATION.earthSphere = new THREE.SphereGeometry(EARTH_RADIUS,40,40);
    SIMULATION.earthObject = new THREE.Mesh(SIMULATION.earthSphere, SIMULATION.earthMaterial);
    SIMULATION.earthObject.rotateY(Math.PI/3.0);
    SIMULATION.earthObject.rotateZ(Math.PI/3.0);
    
    SIMULATION.earthObject.position.z = 0;
    
    SIMULATION.earthPosition = -EARTH_RADIUS*10;
    SIMULATION.earthObject.position.x = SIMULATION.earthPosition;
    SIMULATION.earthObject.position.y = 0;
        
    reset_parameters();   
    
    SIMULATION.doneInit = true;
    requestAnimationFrame(update);
}


/* functions that handle input changes (when sliders are changed, they update the values in the simulation to set the new values) */

function relabel(id_name, new_value)
{
    $("#"+id_name).text(new_value);
}

function onchange_solidangle(t)
{
    t = t ? t.value : $("#solidangle").val();
    SIMULATION.sphericalSaleSolidAngle = t*Math.PI;
    SIMULATION.sphericalSailCutoffDistance = - SIMULATION.sphericalSailRadius0 * Math.cos(SIMULATION.sphericalSaleSolidAngle/2.0);
    relabel("solidanglel", t + "π");
    if (SIMULATION.sphericalSailCutoffPlane != undefined){
	var newSurfaceArea = 2 * Math.PI * SIMULATION.sphericalSailRadius0 * (SIMULATION.sphericalSailRadius0 + SIMULATION.sphericalSailCutoffDistance);
	
	var oldSAtoNewSARatio = AREA_OF_SAIL/newSurfaceArea;
	SIMULATION.radiusScaleFactor = Math.sqrt(oldSAtoNewSARatio);
	SIMULATION.sphericalSailCutoffPlane.set(new THREE.Vector3(1, 0, 0), 0);
	
	//SIMULATION.sphericalSailCutoffPlane.set(new THREE.Vector3(1, 0, 0), SIMULATION.radiusScaleFactor*SIMULATION.sphericalSailCutoffDistance);
	SIMULATION.sphereSail.scale.set(SIMULATION.radiusScaleFactor, SIMULATION.radiusScaleFactor, SIMULATION.radiusScaleFactor);
	SIMULATION.sphereSail.position.set(SIMULATION.sphericalSailCutoffDistance*SIMULATION.radiusScaleFactor, 0, 0);
	SIMULATION.laserBeamObject.scale.x = (SIMULATION.radiusScaleFactor*Math.sin(SIMULATION.sphericalSaleSolidAngle/2.0));
	SIMULATION.laserBeamObject.scale.z = (SIMULATION.radiusScaleFactor*Math.sin(SIMULATION.sphericalSaleSolidAngle/2.0));
    }
}

function onchange_timestep(t)
{
    t = t ? t.value : $("#timestep").val();
    SIMULATION.DeltaT = parseFloat(t);
}

function onchange_com(t)
{
    t = t ? t.value : $("#com").val();
    SIMULATION.centerOfMass = parseFloat(t)*METERS;
    relabel("coml", t);
}

function onchange_mass(t)
{
    t = t ? t.value : $("#mass").val();
    SIMULATION.totalMass = parseFloat(t) * 1e-3;
    relabel("massl", t);
}

function onchange_omegax(t)
{
    t = t ? t.value : $("#omegax").val();
    SIMULATION.omegaX = parseFloat(t);
}

function start_logging(begin_message, logcount)
{
    SIMULATION.logcount = logcount;
    log_in_box(begin_message);
}

function log_in_box(text)
{
    var currentContent = $("#logvals").val();
    currentContent += text + "\n";
    $("#logvals").val(currentContent);
}

function perturb_y_pos(t)
{
    t = $("#pyposition").val();
    var text = "## Post-perturbing Y-position\n";
    text += "# \t t \t xpos \t ypos \t xangle \t yangle";
    start_logging(text, 200);
    SIMULATION.sailPosition[1] += parseFloat(t);
}


function perturb_z_pos(t)
{
    t = $("#pzposition").val();
    
    // the z-axis in the simulation is the x-axis in the paper
    var text = "## Post-perturbing X-position\n";
    text += "# \t t \t xpos \t ypos \t xangle \t yangle";
    start_logging(text, 200);
    SIMULATION.sailPosition[2] += parseFloat(t);
}

function perturb_z_angle(t)
{
    t = $("#pzangle").val();
    var text = "## Post-perturbing X-angle\n";
    text += "# \t t \t xpos \t ypos \t xangle \t yangle";
    start_logging(text, 200);
    SIMULATION.sailAngle[2] += parseFloat(t);
}

function perturb_y_angle(t)
{
    t = $("#pyangle").val();
    var text = "## Post-perturbing Y-angle\n";
    text += "# \t t \t ypos \t zpos \t xangle \t yangle";
    start_logging(text, 200);
    SIMULATION.sailAngle[1] += parseFloat(t);
}

