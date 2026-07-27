

<template>
    <router-view></router-view>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useRoute } from "vue-router";

const route = useRoute();
const emit = defineEmits(['titulo'])

onMounted(() => {
    console.log("route", route.name);
    emit("titulo", titlePros(route.name?.toString()))
})


function titlePros(routername?: string): {} {
    let titulo = {};
    switch (routername) {
        case "login":
        case "registro":
        case "perfil":
        case "senha":
            titulo = {
                mostrarTitulo: false
            }
            break;
        case "detalhe":
            titulo = {
                iconClass: 'fa fa-users',
                subtitulo: 'Detalhes do Evento',
                titulo: "Evento",
                router: "evento"
            }
            break;
        default:
            titulo
    }
    return titulo;
}
</script>

<style scoped>
</style>
