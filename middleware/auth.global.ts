import { defineNuxtRouteMiddleware, navigateTo, useCookie, useRouter } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to, from) => {
    const token = useCookie('token')

    // Allow public routes
    if (to.path === '/login' || to.path.startsWith('/status/')) return

    // If no token exists, force login
    if (!token.value) {
        return navigateTo('/login')
    }

    // Verify token with API
    try {
        await $fetch('/api/verify', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token.value}`,
            },
        })
    } catch (error: any) {
        console.error('Token verification failed:', error)
        token.value = null
        return navigateTo('/login')
    }
})
