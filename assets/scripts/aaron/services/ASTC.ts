import { assetManager, director, gfx, js, sys, AssetManager, ImageAsset, SpriteFrame } from 'cc';

import { Service } from '../core';
import { ASTC_FORMAT, IAstc } from '../interfaces';
import { MESSAGES } from '../macro';
import { IMemoryImageSource } from '../types';

enum PixelFormat {
  RGB565 = gfx.Format.R5G6B5,
  RGB5A1 = gfx.Format.RGB5A1,
  RGBA4444 = gfx.Format.RGBA4,
  RGB888 = gfx.Format.RGB8,
  RGB32F = gfx.Format.RGB32F,
  RGBA8888 = gfx.Format.RGBA8,
  RGBA32F = gfx.Format.RGBA32F,
  A8 = gfx.Format.A8,
  I8 = gfx.Format.L8,
  AI8 = gfx.Format.LA8,
  RGB_PVRTC_2BPPV1 = gfx.Format.PVRTC_RGB2,
  RGBA_PVRTC_2BPPV1 = gfx.Format.PVRTC_RGBA2,
  RGB_A_PVRTC_2BPPV1 = 1024,
  RGB_PVRTC_4BPPV1 = gfx.Format.PVRTC_RGB4,
  RGBA_PVRTC_4BPPV1 = gfx.Format.PVRTC_RGBA4,
  RGB_A_PVRTC_4BPPV1 = 1025,
  RGB_ETC1 = gfx.Format.ETC_RGB8,
  RGBA_ETC1 = 1026,
  RGB_ETC2 = gfx.Format.ETC2_RGB8,
  RGBA_ETC2 = gfx.Format.ETC2_RGBA8,
  RGBA_ASTC_4x4 = gfx.Format.ASTC_RGBA_4X4,
  RGBA_ASTC_5x4 = gfx.Format.ASTC_RGBA_5X4,
  RGBA_ASTC_5x5 = gfx.Format.ASTC_RGBA_5X5,
  RGBA_ASTC_6x5 = gfx.Format.ASTC_RGBA_6X5,
  RGBA_ASTC_6x6 = gfx.Format.ASTC_RGBA_6X6,
  RGBA_ASTC_8x5 = gfx.Format.ASTC_RGBA_8X5,
  RGBA_ASTC_8x6 = gfx.Format.ASTC_RGBA_8X6,
  RGBA_ASTC_8x8 = gfx.Format.ASTC_RGBA_8X8,
  RGBA_ASTC_10x5 = gfx.Format.ASTC_RGBA_10X5,
  RGBA_ASTC_10x6 = gfx.Format.ASTC_RGBA_10X6,
  RGBA_ASTC_10x8 = gfx.Format.ASTC_RGBA_10X8,
  RGBA_ASTC_10x10 = gfx.Format.ASTC_RGBA_10X10,
  RGBA_ASTC_12x10 = gfx.Format.ASTC_RGBA_12X10,
  RGBA_ASTC_12x12 = gfx.Format.ASTC_RGBA_12X12,
}

/**
 * ASTC 压缩纹理支持
 */
export class Astc extends Service implements IAstc {
  readonly token: string = MESSAGES.ASTC.CATEGORY;
  /** 目标纹理格式 */
  private _format: ASTC_FORMAT = gfx.Format.ASTC_RGBA_6X6;

  /** 解析器 */
  private _parser = (<any>ImageAsset).parseCompressedTextures;

  /**
   * 是否支持指定的纹理格式
   * @param format 纹理格式
   * @returns
   */
  public isFormatSupported(format: ASTC_FORMAT) {
    return (director.root!.device.getFormatFeatures(format) & gfx.FormatFeatureBit.SAMPLED_TEXTURE) > 0;
  }

  /**
   * 目标纹理格式
   */
  public get targetFormat() {
    return this._format;
  }
  public set targetFormat(format: ASTC_FORMAT) {
    this._format = format;
  }

  public isPlatformSupported() {
    return this.isFormatSupported(this._format);
  }

  initialize() {
    if (sys.isBrowser) return;

    // ------------------- ASTC 解析预备开始 -------------------
    const COMPRESSED_MIPMAP_MAGIC = 0x50494d43;
    const COMPRESSED_HEADER_LENGTH = 4;
    const COMPRESSED_MIPMAP_DATA_SIZE_LENGTH = 4;
    const COMPRESSED_MIPMAP_LEVEL_COUNT_LENGTH = 4;
    const ASTC_MAGIC = 0x5ca1ab13;
    const ASTC_HEADER_LENGTH = 16; // The header length
    const ASTC_HEADER_MAGIC = 4;
    const ASTC_HEADER_SIZE_X_BEGIN = 7;
    const ASTC_HEADER_SIZE_Y_BEGIN = 10;
    const CUSTOM_PIXEL_FORMAT = 1024;

    function parseCompressedTextures(file: ArrayBuffer | ArrayBufferView, type: number): IMemoryImageSource {
      const out: IMemoryImageSource = {
        _data: new Uint8Array(0),
        _compressed: true,
        width: 0,
        height: 0,
        format: 0,
        mipmapLevelDataSize: [],
      };

      const buffer = file instanceof ArrayBuffer ? file : file.buffer;
      const bufferView = new DataView(buffer);
      // Get a view of the arrayBuffer that represents compress header.
      const magicNumber = bufferView.getUint32(0, true);
      // Do some sanity checks to make sure this is a valid compress file.
      if (magicNumber === COMPRESSED_MIPMAP_MAGIC) {
        // Get a view of the arrayBuffer that represents compress document.
        const mipmapLevelNumber = bufferView.getUint32(COMPRESSED_HEADER_LENGTH, true);
        const mipmapLevelDataSize = bufferView.getUint32(
          COMPRESSED_HEADER_LENGTH + COMPRESSED_MIPMAP_LEVEL_COUNT_LENGTH,
          true
        );
        const fileHeaderByteLength =
          COMPRESSED_HEADER_LENGTH +
          COMPRESSED_MIPMAP_LEVEL_COUNT_LENGTH +
          mipmapLevelNumber * COMPRESSED_MIPMAP_DATA_SIZE_LENGTH;

        // Get a view of the arrayBuffer that represents compress chunks.
        parseCompressedTexture(file, 0, fileHeaderByteLength, mipmapLevelDataSize, type, out);
        let beginOffset = fileHeaderByteLength + mipmapLevelDataSize;

        for (let i = 1; i < mipmapLevelNumber; i++) {
          const endOffset = bufferView.getUint32(
            COMPRESSED_HEADER_LENGTH + COMPRESSED_MIPMAP_LEVEL_COUNT_LENGTH + i * COMPRESSED_MIPMAP_DATA_SIZE_LENGTH,
            true
          );
          parseCompressedTexture(file, i, beginOffset, endOffset, type, out);
          beginOffset += endOffset;
        }
      } else {
        parseCompressedTexture(file, 0, 0, 0, type, out);
      }
      return out;
    }

    function parseCompressedTexture(
      file: ArrayBuffer | ArrayBufferView,
      levelIndex: number,
      beginOffset: number,
      endOffset: number,
      type: number,
      out: IMemoryImageSource
    ): void {
      parseASTCTexture(file, levelIndex, beginOffset, endOffset, out);
    }

    function parseASTCTexture(
      file: ArrayBuffer | ArrayBufferView,
      levelIndex: number,
      beginOffset: number,
      endOffset: number,
      out: IMemoryImageSource
    ): void {
      const buffer = file instanceof ArrayBuffer ? file : file.buffer;
      const header = new Uint8Array(buffer, beginOffset, ASTC_HEADER_LENGTH);
      const magic_val = header[0] + (header[1] << 8) + (header[2] << 16) + (header[3] << 24);
      if (magic_val !== ASTC_MAGIC) {
        throw new Error('Invalid magic number in ASTC header');
      }

      const xdim = header[ASTC_HEADER_MAGIC];
      const ydim = header[ASTC_HEADER_MAGIC + 1];
      const zdim = header[ASTC_HEADER_MAGIC + 2];
      if (
        (xdim < 3 || xdim > 6 || ydim < 3 || ydim > 6 || zdim < 3 || zdim > 6) &&
        (xdim < 4 ||
          xdim === 7 ||
          xdim === 9 ||
          xdim === 11 ||
          xdim > 12 ||
          ydim < 4 ||
          ydim === 7 ||
          ydim === 9 ||
          ydim === 11 ||
          ydim > 12 ||
          zdim !== 1)
      ) {
        throw new Error('Invalid block number in ASTC header');
      }

      const format = getASTCFormat(xdim, ydim);
      const byteOffset = beginOffset + ASTC_HEADER_LENGTH;
      const length = endOffset - ASTC_HEADER_LENGTH;
      if (endOffset > 0) {
        const srcView = new Uint8Array(buffer, byteOffset, length);
        const dstView = new Uint8Array(out._data!.byteLength + srcView.byteLength);
        dstView.set(out._data as Uint8Array);
        dstView.set(srcView, out._data!.byteLength);
        out._data = dstView;
        out.mipmapLevelDataSize![levelIndex] = length;
      } else {
        out._data = new Uint8Array(buffer, byteOffset);
      }
      out.width =
        levelIndex > 0
          ? out.width
          : header[ASTC_HEADER_SIZE_X_BEGIN] +
            (header[ASTC_HEADER_SIZE_X_BEGIN + 1] << 8) +
            (header[ASTC_HEADER_SIZE_X_BEGIN + 2] << 16);
      out.height =
        levelIndex > 0
          ? out.height
          : header[ASTC_HEADER_SIZE_Y_BEGIN] +
            (header[ASTC_HEADER_SIZE_Y_BEGIN + 1] << 8) +
            (header[ASTC_HEADER_SIZE_Y_BEGIN + 2] << 16);
      out.format = format;
    }

    function getASTCFormat(xdim: number, ydim: number) {
      if (xdim === 4) {
        return PixelFormat.RGBA_ASTC_4x4;
      }
      if (xdim === 5) {
        if (ydim === 4) {
          return PixelFormat.RGBA_ASTC_5x4;
        }
        return PixelFormat.RGBA_ASTC_5x5;
      }
      if (xdim === 6) {
        if (ydim === 5) {
          return PixelFormat.RGBA_ASTC_6x5;
        }
        return PixelFormat.RGBA_ASTC_6x6;
      }
      if (xdim === 8) {
        if (ydim === 5) {
          return PixelFormat.RGBA_ASTC_8x5;
        }
        if (ydim === 6) {
          return PixelFormat.RGBA_ASTC_8x6;
        }
        return PixelFormat.RGBA_ASTC_8x8;
      }
      if (xdim === 10) {
        if (ydim === 5) {
          return PixelFormat.RGBA_ASTC_10x5;
        }
        if (ydim === 6) {
          return PixelFormat.RGBA_ASTC_10x6;
        }
        if (ydim === 8) {
          return PixelFormat.RGBA_ASTC_10x8;
        }
        return PixelFormat.RGBA_ASTC_10x10;
      }
      if (ydim === 10) {
        return PixelFormat.RGBA_ASTC_12x10;
      }
      return PixelFormat.RGBA_ASTC_12x12;
    }

    this._parser = parseCompressedTextures;
    // ------------------- ASTC 解析预备结束 -------------------

    type Downloader = AssetManager.Downloader & {
      _downloadArrayBuffer: (
        url: string,
        options: Record<string, any>,
        oncomplete: (err: Error | null, data?: any) => void
      ) => void;
    };
    const downloader = assetManager.downloader as Downloader;
    const parser = assetManager.parser;
    const factory = assetManager.factory;
    downloader.register('.astc', (url, options, oncomplete) => {
      downloader._downloadArrayBuffer(url, options, (err: any, data: ArrayBuffer) => {
        if (data) {
          this.logger.d(MESSAGES.ASTC.DOWNLOAD_OK, url, js.getClassName(data));
        } else {
          this.logger.e(MESSAGES.ASTC.DOWNLOAD_BAD, url);
        }
        oncomplete && oncomplete(err, { file: data, url });
      });
    });
    parser.register('.astc', function (data, options, oncomplete) {
      if (data && data.file instanceof ArrayBuffer) {
        const u8 = new Uint8Array(data.file);
        const astc = parseCompressedTextures(u8, 2);
        this.logger.d(MESSAGES.ASTC.PARSE_OK, data.url, js.getClassName(astc));
        oncomplete && oncomplete(null, { file: astc, url: data.url });
      } else {
        this.logger.e(MESSAGES.ASTC.PARSE_BAD, data.url);
        oncomplete && oncomplete(null, null);
      }
    });
    factory.register('.astc', (id, data, options, onComplete) => {
      let out: ImageAsset | null = null;
      let err: Error | null = null;
      try {
        out = new ImageAsset();
        out._nativeUrl = id;
        out._nativeAsset = data.file;
        this.logger.d(MESSAGES.ASTC.CREATE_OK, data.url, out);
      } catch (e) {
        err = e as Error;
        this.logger.e(MESSAGES.ASTC.CREATE_BAD, data.url);
      }
      onComplete(err, out);
    });
  }

  public createSpriteFrameByInfo(info: IMemoryImageSource | ImageAsset) {
    if (info instanceof ImageAsset) {
      return SpriteFrame.createWithImage(info);
    } else if (this.isFormatSupported(info.format) && info._data) {
      const image = this._parser(info._data.buffer, 2);
      return SpriteFrame.createWithImage(image);
    }
    return null;
  }

  public createImageAsset(info: IMemoryImageSource | ImageAsset) {
    if (info instanceof ImageAsset) {
      return info;
    } else if (this.isFormatSupported(info.format) && info._data) {
      return this._parser(info._data.buffer, 2);
    }
    return null;
  }
}
