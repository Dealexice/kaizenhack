import * as pdfParseModule from 'pdf-parse';

const pdfParse = pdfParseModule.default || pdfParseModule;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);

    return Response.json({
      text: data.text,
      pages: data.numpages,
      info: data.info,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    return Response.json(
      { error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
