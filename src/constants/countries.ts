export interface Country {
  code: string;
  isKorean: boolean;
  phoneCode: string;
}

export const countries: Country[] = [
  { code: 'KR', isKorean: true, phoneCode: '+82' },
  { code: 'MX', isKorean: false, phoneCode: '+52' },
  { code: 'CO', isKorean: false, phoneCode: '+57' },
  { code: 'AR', isKorean: false, phoneCode: '+54' },
  { code: 'PE', isKorean: false, phoneCode: '+51' },
  { code: 'VE', isKorean: false, phoneCode: '+58' },
  { code: 'CL', isKorean: false, phoneCode: '+56' },
  { code: 'EC', isKorean: false, phoneCode: '+593' },
  { code: 'GT', isKorean: false, phoneCode: '+502' },
  { code: 'HN', isKorean: false, phoneCode: '+504' },
  { code: 'NI', isKorean: false, phoneCode: '+505' },
  { code: 'PA', isKorean: false, phoneCode: '+507' },
  { code: 'PY', isKorean: false, phoneCode: '+595' },
  { code: 'UY', isKorean: false, phoneCode: '+598' },
  { code: 'BO', isKorean: false, phoneCode: '+591' },
  { code: 'CR', isKorean: false, phoneCode: '+506' },
  { code: 'DO', isKorean: false, phoneCode: '+1' },
  { code: 'SV', isKorean: false, phoneCode: '+503' },
  { code: 'CU', isKorean: false, phoneCode: '+53' },
  { code: 'PR', isKorean: false, phoneCode: '+1' },
  { code: 'BR', isKorean: false, phoneCode: '+55' },
  { code: 'US', isKorean: false, phoneCode: '+1' },
  { code: 'CA', isKorean: false, phoneCode: '+1' },
  { code: 'JP', isKorean: false, phoneCode: '+81' },
  { code: 'CN', isKorean: false, phoneCode: '+86' },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getKoreanCountries = (): Country[] => {
  return countries.filter(country => country.isKorean);
};

export const getNonKoreanCountries = (): Country[] => {
  return countries.filter(country => !country.isKorean);
};
