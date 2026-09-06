import 'reflect-metadata';

import { createApp } from 'vue'
import 'normalize.css'
import './style.css'
import App from './App.vue'
import router from './plugins/router'
import PortalVue from 'portal-vue'

import { OhVueIcon, addIcons } from "oh-vue-icons";
import { BiHexagon, BiLightbulbOff, BiPatchQuestion, CoAvTimer, CoDiamond, FaChevronDown, FaChevronRight, LaAngleLeftSolid, LaBanSolid, LaBugSolid, LaChartBar, LaCheckCircleSolid, LaCheckDoubleSolid, LaCheckSolid, LaCircleSolid, LaClipboardCheckSolid, LaExclamationTriangleSolid, LaFileExportSolid, LaFileImportSolid, LaInfoCircleSolid, LaMap, LaMinusSolid, LaPaperPlane, LaPlaySolid, LaTimesSolid, LaTrashSolid, LaUndoAltSolid, LaUndoSolid, LaWindowClose, MdAddTwotone, MdCheckTwotone, MdCloseTwotone, MdHorizontalruleTwotone, MdHourglassdisabledTwotone, MdHourglasstopTwotone, MdLinkTwotone, MdLockopenTwotone, MdLockTwotone, MdNumbersTwotone, MdThumbupOutlined, MdVisibilityoffTwotone, MdVisibilityTwotone, MdWarningTwotone } from "oh-vue-icons/icons";

addIcons(LaAngleLeftSolid, LaUndoAltSolid, LaPlaySolid, LaMap, LaBugSolid, LaInfoCircleSolid, LaExclamationTriangleSolid, LaMinusSolid, LaCircleSolid, LaTimesSolid, LaCheckSolid, LaCheckCircleSolid, LaBanSolid, LaCheckDoubleSolid, LaFileExportSolid, LaTrashSolid, LaFileImportSolid, LaClipboardCheckSolid, FaChevronRight, FaChevronDown, BiHexagon, CoDiamond, CoAvTimer, BiLightbulbOff, BiPatchQuestion, MdNumbersTwotone, MdHourglasstopTwotone, MdLockTwotone, MdLockopenTwotone, MdHourglassdisabledTwotone, MdAddTwotone, MdHorizontalruleTwotone, MdCloseTwotone, MdCheckTwotone, MdThumbupOutlined, MdVisibilityoffTwotone, MdLinkTwotone, MdVisibilityTwotone, MdWarningTwotone, LaChartBar, LaUndoSolid, LaWindowClose, LaPaperPlane)

const app = createApp(App)
app.component('v-icon', OhVueIcon)
app.use(PortalVue)
app.use(router).mount('#app')
