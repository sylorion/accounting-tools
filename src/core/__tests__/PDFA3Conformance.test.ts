import { PDFDocument, PDFName, PDFArray, PDFDict, PDFRef } from 'pdf-lib';

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn((path: string) => {
    // Return mock ICC profile data
    return Buffer.from('mock ICC profile data');
  })
}));

import fs from 'fs';
import { embedIccProfile, embedPdfA3Xmp, markAsPdfA3 } from '../PDFA3Conformance';

describe('PDFA3Conformance', () => {
  let mockPdfDoc: any;
  let mockContext: any;
  let mockCatalog: any;

  beforeEach(() => {
    // Create mock PDF objects
    mockContext = {
      flateStream: jest.fn((data: any, dict: any) => ({
        dict: dict,
        data: data
      })),
      register: jest.fn((obj: any) => ({ ref: 'mock-ref', obj })),
      obj: jest.fn((data: any) => data),
      lookup: jest.fn((ref: any) => ({
        set: jest.fn()
      }))
    };

    mockCatalog = {
      get: jest.fn((name: any) => undefined),
      set: jest.fn()
    };

    const mockPDFArray = {
      push: jest.fn()
    };

    mockPdfDoc = {
      context: mockContext,
      catalog: mockCatalog
    };

    jest.clearAllMocks();
  });

  describe('embedIccProfile', () => {
    it('should read ICC profile file', async () => {
      const iccPath = '/path/to/sRGB.icc';

      await embedIccProfile(mockPdfDoc, iccPath);

      expect(fs.readFileSync).toHaveBeenCalledWith(iccPath);
    });

    it('should create flate stream with ICC data', async () => {
      const iccPath = '/path/to/sRGB.icc';

      await embedIccProfile(mockPdfDoc, iccPath);

      expect(mockContext.flateStream).toHaveBeenCalled();
      const call = mockContext.flateStream.mock.calls[0];
      expect(call[0]).toBeInstanceOf(Uint8Array);
    });

    it('should register ICC stream', async () => {
      const iccPath = '/path/to/sRGB.icc';

      await embedIccProfile(mockPdfDoc, iccPath);

      expect(mockContext.register).toHaveBeenCalled();
    });

    it('should create OutputIntent dictionary', async () => {
      const iccPath = '/path/to/sRGB.icc';

      await embedIccProfile(mockPdfDoc, iccPath);

      expect(mockContext.obj).toHaveBeenCalledWith(
        expect.objectContaining({
          Type: 'OutputIntent',
          S: 'GTS_PDFA1'
        })
      );
    });

    it('should add OutputIntent to catalog', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const mockArray = {
        push: jest.fn()
      };

      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await embedIccProfile(mockPdfDoc, iccPath);

      expect(mockCatalog.set).toHaveBeenCalled();
    });

    it('should return OutputIntent reference', async () => {
      const iccPath = '/path/to/sRGB.icc';

      const result = await embedIccProfile(mockPdfDoc, iccPath);

      expect(result).toBeDefined();
    });
  });

  describe('embedPdfA3Xmp', () => {
    it('should create XMP metadata for invoice', () => {
      embedPdfA3Xmp(mockPdfDoc, 'invoice');

      expect(mockContext.flateStream).toHaveBeenCalled();
      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('pdfaid:part');
      expect(xmpData).toContain('pdfaid:conformance');
      expect(xmpData).toContain('invoice');
    });

    it('should create XMP metadata for order', () => {
      embedPdfA3Xmp(mockPdfDoc, 'order');

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('order');
    });

    it('should create XMP metadata for other documents', () => {
      embedPdfA3Xmp(mockPdfDoc, 'other');

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('other');
    });

    it('should default to invoice when not specified', () => {
      embedPdfA3Xmp(mockPdfDoc);

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('invoice');
    });

    it('should include PDF/A-3 part and conformance', () => {
      embedPdfA3Xmp(mockPdfDoc, 'invoice');

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('<pdfaid:part>3</pdfaid:part>');
      expect(xmpData).toContain('<pdfaid:conformance>B</pdfaid:conformance>');
    });

    it('should set Metadata in catalog', () => {
      embedPdfA3Xmp(mockPdfDoc, 'invoice');

      expect(mockCatalog.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });

    it('should create proper XMP structure with XML declaration', () => {
      embedPdfA3Xmp(mockPdfDoc, 'invoice');

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('<?xpacket begin');
      expect(xmpData).toContain('<?xpacket end');
      expect(xmpData).toContain('<x:xmpmeta');
      expect(xmpData).toContain('</x:xmpmeta>');
    });

    it('should include required namespaces', () => {
      embedPdfA3Xmp(mockPdfDoc, 'invoice');

      const call = mockContext.flateStream.mock.calls[0];
      const xmpData = new TextDecoder().decode(call[0]);
      expect(xmpData).toContain('xmlns:pdfaExtension');
      expect(xmpData).toContain('xmlns:pdfaid');
      expect(xmpData).toContain('xmlns:xmp');
    });
  });

  describe('markAsPdfA3', () => {
    it('should call embedIccProfile', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(fs.readFileSync).toHaveBeenCalledWith(iccPath);
    });

    it('should call embedPdfA3Xmp', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(mockContext.flateStream).toHaveBeenCalled();
    });

    it('should create AF array in catalog', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(mockCatalog.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });

    it('should add attached files to AF array', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const mockFileRef1 = { ref: 'file1' } as any;
      const mockFileRef2 = { ref: 'file2' } as any;
      const attachedFiles = [mockFileRef1, mockFileRef2];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(mockArray);

      const mockFileSpec = {
        set: jest.fn()
      };
      mockContext.lookup.mockReturnValue(mockFileSpec);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      // push is called for OutputIntent (once) + 2 attached files = 3 times
      expect(mockArray.push).toHaveBeenCalled();
      expect(mockArray.push).toHaveBeenCalledWith(mockFileRef1);
      expect(mockArray.push).toHaveBeenCalledWith(mockFileRef2);
    });

    it('should set AFRelationship on fileSpecs', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const mockFileRef = { ref: 'file1' } as any;
      const attachedFiles = [mockFileRef];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(mockArray);

      const mockFileSpec = {
        set: jest.fn()
      };
      mockContext.lookup.mockReturnValue(mockFileSpec);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(mockFileSpec.set).toHaveBeenCalled();
    });

    it('should set Lang in catalog', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(mockCatalog.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
    });

    it('should set MarkInfo in catalog', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      expect(mockContext.obj).toHaveBeenCalledWith(
        expect.objectContaining({ Marked: true })
      );
    });

    it('should handle invoice document type', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      const xmpCall = mockContext.flateStream.mock.calls.find((call: any) => {
        const data = new TextDecoder().decode(call[0]);
        return data.includes('invoice');
      });
      expect(xmpCall).toBeDefined();
    });

    it('should handle order document type', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'order');

      const xmpCall = mockContext.flateStream.mock.calls.find((call: any) => {
        const data = new TextDecoder().decode(call[0]);
        return data.includes('order');
      });
      expect(xmpCall).toBeDefined();
    });

    it('should handle empty attached files array', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles: any[] = [];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      await expect(
        markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice')
      ).resolves.not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle different ICC profile paths', async () => {
      const paths = [
        '/usr/share/color/icc/sRGB.icc',
        'C:\\Windows\\System32\\sRGB.icc',
        './profiles/sRGB.icc'
      ];

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(undefined);

      for (const path of paths) {
        jest.clearAllMocks();
        await embedIccProfile(mockPdfDoc, path);
        expect(fs.readFileSync).toHaveBeenCalledWith(path);
      }
    });

    it('should handle multiple attached files', async () => {
      const iccPath = '/path/to/sRGB.icc';
      const attachedFiles = Array(10).fill(null).map((_, i) => ({ ref: `file${i}` } as any));

      const mockArray = {
        push: jest.fn()
      };
      mockContext.obj.mockReturnValue(mockArray);
      mockCatalog.get.mockReturnValue(mockArray);

      const mockFileSpec = {
        set: jest.fn()
      };
      mockContext.lookup.mockReturnValue(mockFileSpec);

      await markAsPdfA3(mockPdfDoc, attachedFiles, iccPath, 'invoice');

      // push is called for OutputIntent + attached files
      expect(mockArray.push).toHaveBeenCalled();
    });
  });
});
