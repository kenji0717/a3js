import { defineConfig } from 'vitepress'

export default defineConfig({
  //ignoreDeadLinks: true
  base: '/a3js/',
  themeConfig: {
    sidebar: [
      {
        text: 'はじめよう',
        link: '/GettingStarted'
      },
      {
        text: '各種機能紹介',
        link: '/FeaturesIntroduction/',
        items: [
          {
            text: '3Dの表示形式',
            link: '/FeaturesIntroduction/View/',
            items: [
              { text: 'Windowクラス', link: '/FeaturesIntroduction/View/Window' },
              { text: 'Canvasクラス', link: '/FeaturesIntroduction/View/Canvas' },
              { text: 'GameCanvasクラス', link: '/FeaturesIntroduction/View/GameCanvas' },
              { text: 'VRViewクラス', link: '/FeaturesIntroduction/View/VRView' },
              { text: 'ARViewクラス', link: '/FeaturesIntroduction/View/ARView' }
            ]
          },
          {
            text: 'ActionObjectについて',
            link: '/FeaturesIntroduction/ActionObject/',
            items: [
              { text: 'GLTFクラス', link: '/FeaturesIntroduction/ActionObject/GLTF' },
              { text: 'Acerola3Dクラス', link: '/FeaturesIntroduction/ActionObject/Acerola3D' }
            ]
          },
          {
            text: 'モードについて',
            link: '/FeaturesIntroduction/SetMode/',
            items: [
              { text: 'Defaultモード', link: '/FeaturesIntroduction/SetMode/Default' },
              { text: 'Smoothモード', link: '/FeaturesIntroduction/SetMode/Smooth' },
              { text: 'Followモード', link: '/FeaturesIntroduction/SetMode/Follow' },
              { text: 'Billboardモード', link: '/FeaturesIntroduction/SetMode/Billboard' },
              { text: 'SmoothBillboardモード', link: '/FeaturesIntroduction/SetMode/SmoothBillboard' },
              { text: 'SimplePhysicsモード', link: '/FeaturesIntroduction/SetMode/SimplePhysics' },
              { text: 'KinematicCharacterモード', link: '/FeaturesIntroduction/SetMode/KinematicCharacter' },
              { text: 'DynamicCharacterモード', link: '/FeaturesIntroduction/SetMode/DynamicCharacter' }
            ]
          },
          {
            text: '移動・回転・拡大縮小について',
            link: '/FeaturesIntroduction/MoveRotateScale/'
          },
          {
            text: 'サウンドについて',
            link: '/FeaturesIntroduction/AboutSound/',
            items: [
              { text: 'Soundクラス', link: '/FeaturesIntroduction/AboutSound/Sound' }
            ]
          },
          {
            text: 'Sceneの使用方法',
            link: '/FeaturesIntroduction/Scene/'
          },
          {
            text: 'ライトについて',
            link: '/FeaturesIntroduction/AboutLight/',
            items: [
              { text: 'StandardLightsクラス', link: '/FeaturesIntroduction/AboutLight/StandardLights' }
            ]
          },
          {
            text: 'Controllerについて',
            link: '/FeaturesIntroduction/Controller/',
            items: [
              { text: 'OrbitControllerクラス', link: '/FeaturesIntroduction/Controller/OrbitController' },
              { text: 'AvatarPositionControllerクラス', link: '/FeaturesIntroduction/Controller/AvatarPositionController' },
              { text: 'AvatarVelocityControllerクラス', link: '/FeaturesIntroduction/Controller/AvatarVelocityController' }
            ]
          },
          {
            text: '当たり判定',
            link: '/FeaturesIntroduction/CollisionDetection/'
          },
          {
            text: 'クリック(タップ)イベント処理',
            link: '/FeaturesIntroduction/ClickAndTap/'
          },
          {
            text: '影を表示する方法',
            link: '/FeaturesIntroduction/Shadow/'
          },
          {
            text: '向きとアクションの自動制御',
            link: '/FeaturesIntroduction/AutoDirectionAndAction/'
          },
          {
            text: 'その他の機能',
            link: '/FeaturesIntroduction/OtherFunctions/',
            items: [
              { text: 'Text3Dクラス', link: '/FeaturesIntroduction/OtherFunctions/Text3D' },
              { text: 'ImagePlaneクラス', link: '/FeaturesIntroduction/OtherFunctions/ImagePlane' },
              { text: 'CarControlクラス', link: '/FeaturesIntroduction/OtherFunctions/CarControl' }
            ]
          },
          {
            text: '複雑な物理シミュレーション',
            link: '/FeaturesIntroduction/Joint/'
          }
        ]
      },
      {
        text: 'サンプルプログラム',
        link: '/SamplePrograms/',
        items: [
          { text: 'カーレースサンプルプログラム', link: '/SamplePrograms/CarRace' },
          { text: 'TPSのサンプルプログラム', link: '/SamplePrograms/TPS' },
          { text: 'フライトシミュレーターのサンプル', link: '/SamplePrograms/FlightSimulator' }
        ]
      }
    ]
  }
})
