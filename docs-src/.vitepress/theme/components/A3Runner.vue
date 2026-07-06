<template>
  <div class="a3-runner">
    <div class="a3-runner-buttons">
      <button class="a3-runner-btn" @click="run">実行</button>
      <button class="a3-runner-btn" @click="stop">停止</button>
    </div>
    <iframe class="a3-runner-frame"
            :srcdoc="srcdoc"
            :style="{ height: height + 'px' }"
            title="a3js sample preview"
            allow="accelerometer; autoplay; camera; encrypted-media; geolocation; gyroscope; hid; microphone; magnetometer; midi; payment; usb; serial; xr-spatial-tracking"
            allowfullscreen
            frameborder="0">
    </iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  // public/samples/以下のサンプルファイル名(例: "window-basic.js")
  src: { type: String, required: true },
  height: { type: [String, Number], default: 345 }
})

const emptyPage = '<!DOCTYPE html><html lang="ja"></html>'
const srcdoc = ref(emptyPage)

// サンプルプログラムを実行するページのテンプレート。
// importmapはMarkdown(Vue)内には書けないが、
// iframeのsrcdoc内なら問題なく使える。
const playPageTemplate = `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>a3js sample</title>
    <script type="importmap">
     {
       "imports": {
         "three": "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.min.js",
         "three/addons/": "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/",
         "@dimforge/rapier3d-compat": "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.19.3/+esm",
         "fflate": "https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm",
         "meshoptimizer": "https://unpkg.com/meshoptimizer@1.0.1/meshopt_decoder.module.js",
         "a3js": "https://cdn.jsdelivr.net/npm/a3js@1/+esm"
       }
     }
    <\/script>
  </head>
  <body>
    <script type="module" src="THE_DATA_URL"><\/script>
  </body>
</html>
`

async function run() {
  const res = await fetch(withBase('/samples/' + props.src))
  const code = await res.text()
  const dataUrl = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(code)
  srcdoc.value = playPageTemplate.replace('THE_DATA_URL', dataUrl)
}

function stop() {
  srcdoc.value = emptyPage
}
</script>

<style scoped>
.a3-runner {
  margin: 16px 0;
}
.a3-runner-buttons {
  margin-bottom: 8px;
}
.a3-runner-btn {
  margin-right: 8px;
  padding: 4px 16px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 4px;
  color: var(--vp-c-brand-1);
  font-size: 14px;
}
.a3-runner-btn:hover {
  color: var(--vp-c-white);
  background-color: var(--vp-c-brand-1);
}
.a3-runner-frame {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
}
</style>
