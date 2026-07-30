import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import EventoComponent from '../components/eventos/EventoComponent.vue'
import EventoLista from '../components/eventos/EventoLista.vue'
import DetalhesEvento from '../components/eventos/DetalhesEvento.vue'
import UserComponent from '../components/user/UserComponent.vue'
import LoginComponent from '../components/user/login/LoginComponent.vue'
import RegistrarUsuario from '../components/user/registrar/RegistrarUsuario.vue'
import PerfilUsuario from '../components/user/perfil/PerfilUsuario.vue'
import PalestrantesComponent from '../components/palestrantes/PalestrantesComponent.vue'
import PalestrantesPage from '../components/palestrantes/PalestrantesPage.vue'
import PalestranteFormPage from '../components/palestrantes/PalestranteFormPage.vue'
import { isAuthenticated } from '../services/authToken'

const routes: RouteRecordRaw[] = [
    {
        path: '/user',
        component: UserComponent,
        children: [
            {
                path: 'login',
                component: LoginComponent,
                name: 'login'
            },
            {
                path: 'registro',
                component: RegistrarUsuario,
                name: 'registro'
            },
            {
                path: 'perfil',
                component: PerfilUsuario,
                name: 'perfil',
                meta: { requiresAuth: true }
            },
            {
                path: 'senha',
                redirect: { name: 'perfil' },
                name: 'senha',
                meta: { requiresAuth: true }
            }
        ]
    },
    {
        path: '/eventos',
        component: EventoComponent,
        redirect: '/eventos/lista',
        children: [
            {
                path: 'detalhes/:id?',
                name: "detalhe",
                component: DetalhesEvento,
                meta: { requiresAuth: true }
            },
            {
                path: 'lista',
                name: "lista",
                component: EventoLista,
            }
        ]
    },
    {
        path: '/palestrantes',
        component: PalestrantesComponent,
        redirect: '/palestrantes/lista',
        children: [
            {
                path: 'detalhes/:id?',
                name: 'palestrante-detalhe',
                component: PalestranteFormPage,
                meta: { requiresAuth: true }
            },
            {
                path: 'lista',
                name: 'palestrantes-lista',
                component: PalestrantesPage,
            }
        ]
    },
    { path: '/:catchAll(.*)*', redirect: '/eventos/lista' }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !isAuthenticated()) {
        return {
            name: 'login',
            query: { redirect: to.fullPath }
        }
    }
})

export default router
