import { rgb, RGB } from 'pdf-lib';
/**
 * A column definition referencing a property key on TLine.
 */
export interface ColumnDef<TLine> {
  id: keyof TLine;        // e.g. "name", "price", "qty", etc.
  header: string;         // displayed column label
  width: number;          // column width in points
  align?: 'left' | 'right' | 'center';
}

/**
 * All rendering options, parametric on TLine.
 */
export interface RendererOption<TLine> {
  // 1. Page & Layout
  pageSize?: 'A4' | 'Letter' | { width: number; height: number };
  orientation?: 'portrait' | 'landscape';
  margin?: number;

  // 2. Branding & Colors
  brandColor?: RGB;
  headerTextColor?: RGB;
  textColor?: RGB;
  backgroundColor?: RGB;  // optional full-page background

  // 3. Fonts & Text
  fontFamilyNormal?: string; 
  fontFamilyBold?: string; 
  fontSizeBody?: number;
  fontSizeHeading?: number;
  lineHeight?: number;

  // 4. Logo & Images
  logo?: Uint8Array; 
  logoScale?: number;

  // 5. Header Config
  showHeader?: boolean;
  headerHeight?: number;
  headerTitle?: string;
  headerSubtitle?: string;

  // 6. Seller & Buyer
  showSellerDetails?: boolean;
  showBuyerDetails?: boolean;
  sellerLabel?: string;
  buyerLabel?: string;

  // 7. Table & Items
  columns?: Array<ColumnDef<TLine>>;
  rowSpacing?: number;
  drawTableGrid?: boolean;

  // 8. Totals Display
  showSubtotal?: boolean;
  showVat?: boolean;
  showGrandTotal?: boolean;
  totalsLabel?: string;

  // 9. Footer & Pagination
  footerNote?: string;
  showPageNumbers?: boolean | 'header' | 'footer';
  pageNumberFormat?: string;

  // 10. Date & Localization
  locale?: string;
  dateFormat?: string; // or a function
}