import React, { useState, useContext } from 'react'
import { Stage, Container, Sprite, useTick, Graphics, Text } from '@inlet/react-pixi'
import { settings, SCALE_MODES } from 'pixi.js'
import * as PLANK from 'planck-js';
import observable from "../components/Observable";

settings.SCALE_MODE = SCALE_MODES.NEAREST

//PLANK js PHYSICS
var plank_world;
var ball_body;
const YSCALE = 500; // needed to align Stage and World height (and width)


const DynamicCoin = () => {
    const [rotation, setRotation] = useState(0)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)

    useTick((delta) => {
        plank_world.step(delta * 0.01);

        var po = plankPositionToPixi(ball_body.getPosition());
        setPosX(po.x)
        setPosY(po.y)
        setRotation(ball_body.getAngle() * -1)


    })

    return <Sprite image="https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/coin.png" anchor={0.5} scale={0.25} rotation={rotation} x={posX} y={posY} />
}

const PixiComponent = () => {

    //Init Physics world
    plank_world = PLANK.World(
        {
            gravity: PLANK.Vec2(0, -10)
        }
    );

    //create physics walls
    var walls = plank_world.createBody();
    walls.createFixture(PLANK.Edge(pixiPositionToPlank(0, 0), pixiPositionToPlank(YSCALE, 0)));
    walls.createFixture(PLANK.Edge(pixiPositionToPlank(YSCALE, 0), pixiPositionToPlank(YSCALE, YSCALE)));
    walls.createFixture(PLANK.Edge(pixiPositionToPlank(0, 0), pixiPositionToPlank(0, YSCALE)));
    walls.createFixture(PLANK.Edge(pixiPositionToPlank(0, YSCALE), pixiPositionToPlank(YSCALE, YSCALE)));

    //create ball and setup ball properties 
    // Place ball at initial position [100,80]
    var ball = plank_world.createDynamicBody(pixiPositionToPlank(100, 80)).createFixture(PLANK.Circle(0.1), { density: 10, restitution: 0.5, friction: 0.9 });
    ball_body = ball.getBody();

    const pushBall = () => {
        var f = PLANK.Vec2(ball_body.getPosition());
        var p = pixiPositionToPlank(120, -10);  // small upward impulse

        f = f.sub(p); //force direction
        f.normalize();
        f.mul(2); //force magnitude
        ball_body.applyLinearImpulse(f, p, true);
    }

    const logger = (data) => {
        console.log(`Set plank: x = ${data}`);
      }
    
    const addImpulse = (data) => {
        if (data && data > 0.5) {
            pushBall();
        }   
     }
    
    plank_world.on('pre-solve', function (contact, oldManifold) {
        var manifold = contact.getManifold();

        if (manifold.pointCount == 0) {
            return;
        }
        var po = plankPositionToPixi(ball_body.getPosition());

        console.log("HIT!! ", po.x, po.y);

    });

    const LINE_WIDTH = 3;
    const drawEdges = React.useCallback(g => {
        g.clear()
        // g.beginFill(0xff3300)
        g.lineStyle(4, 0x895C1D, 1)
        g.moveTo(0, LINE_WIDTH)
        g.lineTo(YSCALE, LINE_WIDTH)
        g.moveTo(YSCALE-LINE_WIDTH, LINE_WIDTH)
        g.lineTo(YSCALE-LINE_WIDTH, YSCALE - LINE_WIDTH)
        g.moveTo(YSCALE, YSCALE - LINE_WIDTH)
        g.lineTo(0, YSCALE - LINE_WIDTH)
        g.moveTo(LINE_WIDTH, YSCALE - LINE_WIDTH)
        g.lineTo(LINE_WIDTH, LINE_WIDTH)
        g.endFill()
    }, [])

    // Give inital push
    pushBall();

    // Set observable callback
    observable.subscribe(logger);
    observable.subscribe(addImpulse);

    return (
        <Stage width={YSCALE} height={YSCALE} options={{ backgroundColor: 0xeef1f5 }} onPointerUp={() => pushBall()}>
            <Graphics draw={drawEdges} />
            <DynamicCoin speed={0.01} />
            <Text text="Click anywhere..." anchor={0.5} x={110} y={20} />
            <Text text="Or Move Your Hands!" anchor={0.5} x={150} y={45} />
        </Stage>
    )
}

export default PixiComponent

//UTIL================

function pixiPositionToPlank(x, y) {
    /*
    Orientation Change
    ==================
    Pixi cordinate system      +
    -------------->+           ^
    |                          |
    |                          |
    |                  ==>     |
    |                          |
    v                           ------------->+
    +                           Plank cordinate system 
    */

    //change Y origin point and direction
    y = (y - YSCALE) * -1;
    //convert pixels to meters (64px = 0.1m)
    y *= 0.0015625;
    x *= 0.0015625;

    return PLANK.Vec2(x, y);
}

function plankPositionToPixi(v) {


    /*
   Orientation Change
   ==================
   Pixi cordinate system      +
   -------------->+           ^
   |                          |
   |                          |
   |                  <==     |
   |                          |
   v                           ------------->+
   +                           Plank cordinate system 
   */


    //convert pixels to meters (64px = 0.1m)
    var retY = v.y * 640;
    var retX = v.x * 640;
    //change Y origin point and direction
    retY = (retY * -1) + YSCALE;
    return { x: retX, y: retY };
}
