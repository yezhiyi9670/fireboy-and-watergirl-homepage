import { createApp } from 'vue'
import 'normalize.css'
import './style.css'
import App from './App.vue'
import router from './plugins/router'
import PortalVue from 'portal-vue'

import { OhVueIcon, addIcons } from "oh-vue-icons";
import { LaAngleLeftSolid, LaBanSolid, LaBugSolid, LaCheckCircleSolid, LaCheckDoubleSolid, LaCheckSolid, LaCircleSolid, LaClipboardCheckSolid, LaExclamationTriangleSolid, LaFileExportSolid, LaFileImportSolid, LaInfoCircleSolid, LaMap, LaMinusSolid, LaPlaySolid, LaTimesSolid, LaTrashSolid, LaUndoAltSolid } from "oh-vue-icons/icons";

addIcons(LaAngleLeftSolid, LaUndoAltSolid, LaPlaySolid, LaMap, LaBugSolid, LaInfoCircleSolid, LaExclamationTriangleSolid, LaMinusSolid, LaCircleSolid, LaTimesSolid, LaCheckSolid, LaCheckCircleSolid, LaBanSolid, LaCheckDoubleSolid, LaFileExportSolid, LaTrashSolid, LaFileImportSolid, LaClipboardCheckSolid)

const app = createApp(App)
app.component('v-icon', OhVueIcon)
app.use(PortalVue)
app.use(router).mount('#app')
