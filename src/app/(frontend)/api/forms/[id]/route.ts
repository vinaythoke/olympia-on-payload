import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import { FormDefinition } from '@/components/forms/FormFieldTypes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = await getPayloadHMR({ config })

    const form = await payload.findByID({
      collection: 'form-builders',
      id,
      req: req as any,
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({ form })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 })
  }
}
