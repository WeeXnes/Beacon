import { defineNuxtRouteMiddleware, navigateTo, useCookie, useRouter, useState } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async (to, from) => {
    const token = useCookie('token')

    // Fetch and check onboarding status
    const isOnboarded = useState<boolean | null>('is-onboarded', () => null);
    if (isOnboarded.value === null) {
        try {
            const status = await $fetch<{ onboarded: boolean }>('/api/onboardingStatus')
            isOnboarded.value = status.onboarded;
        } catch (e) {
            console.error('Failed to check onboarding status:', e);
            isOnboarded.value = true; // Fallback
        }
    }

    // If not onboarded, force redirect to /setup
    if (!isOnboarded.value) {
        if (to.path !== '/setup') {
            return navigateTo('/setup')
        }
        return
    }

    // If onboarded, prevent access to /setup
    if (to.path === '/setup') {
        return navigateTo('/login')
    }

    // Allow public routes
    if (to.path.startsWith('/status/') || to.path.startsWith('/download/')) return

    if (to.path === '/login') return

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
