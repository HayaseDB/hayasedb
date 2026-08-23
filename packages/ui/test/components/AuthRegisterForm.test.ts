import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AuthRegisterForm from '../../app/components/auth/AuthRegisterForm.vue'

async function mount(onSubmit = vi.fn()) {
  const wrapper = await mountSuspended(AuthRegisterForm, {
    props: { onSubmit, providers: ['github'] },
    slots: { footer: () => 'Already registered?' },
  })
  return { wrapper, onSubmit }
}

async function fill(
  wrapper: Awaited<ReturnType<typeof mount>>['wrapper'],
  values: Record<string, string>,
) {
  for (const [name, value] of Object.entries(values)) {
    await wrapper.find(`input[name="${name}"]`).setValue(value)
  }
}

describe('AuthRegisterForm', () => {
  it('blocks submission until the register schema is satisfied', async () => {
    const { wrapper, onSubmit } = await mount()
    await fill(wrapper, {
      name: 'Ann',
      email: 'not-an-email',
      password: 'short',
    })
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() =>
      expect(
        wrapper.findAll('[data-slot="error"]').map((node) => node.text()),
      ).toContain('Enter a valid email address'),
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('passes the parsed payload to onSubmit', async () => {
    const { wrapper, onSubmit } = await mount()
    await fill(wrapper, {
      name: 'Ann',
      email: 'ann@example.com',
      password: 'correct horse battery',
    })
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Ann',
        email: 'ann@example.com',
        password: 'correct horse battery',
      }),
    )
  })

  it('renders social providers and the footer slot', async () => {
    const { wrapper } = await mount()
    expect(wrapper.text()).toContain('Already registered?')
    expect(wrapper.text().toLowerCase()).toContain('github')
  })
})
