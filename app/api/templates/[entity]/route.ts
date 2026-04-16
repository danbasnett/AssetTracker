import { NextResponse } from 'next/server'

const TEMPLATES: Record<string, { filename: string; csv: string }> = {
  assets: {
    filename: 'assets-template.csv',
    csv: [
      'name,assetTag,status,location,serialNumber,modelNumber,supplier,purchaseDate,value',
      'Laptop Pro,ASSET-001,Available,Head Office,SN123456,MBP-2023,Apple,15/01/2024,1299.99',
      'Office Chair,ASSET-002,Available,,,Herman Miller,,,'
    ].join('\n'),
  },
  consumables: {
    filename: 'consumables-template.csv',
    csv: [
      'name,quantity,reorderPoint,unit,modelNumber,location,notes',
      'A4 Paper,500,100,ream,,Head Office,',
      'Printer Ink,12,4,each,INK-001,Head Office,Black ink cartridges'
    ].join('\n'),
  },
  locations: {
    filename: 'locations-template.csv',
    csv: [
      'name,parent',
      'Head Office,',
      'Floor 1,Head Office',
      'Floor 2,Head Office',
      'Server Room,Floor 1'
    ].join('\n'),
  },
  people: {
    filename: 'people-template.csv',
    csv: [
      'name,email,department',
      'Jane Smith,jane.smith@example.com,Engineering',
      'John Doe,john.doe@example.com,Finance'
    ].join('\n'),
  },
}

export async function GET(_req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params
  const template = TEMPLATES[entity]
  if (!template) return NextResponse.json({ error: 'Unknown entity' }, { status: 404 })

  return new NextResponse(template.csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${template.filename}"`,
    },
  })
}
