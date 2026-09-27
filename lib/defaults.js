export const COUNTRY_OPTIONS = {
  us: {
    id: "us",
    label: "US",
    description: "ACA premium tax credit extension benchmark",
    incomeLabel: "Income points",
    incomeMax: 1001,
    currency: "USD",
    defaultVariable: "aca_ptc",
    variables: [
      { value: "aca_ptc", label: "ACA premium tax credit" },
      { value: "household_net_income", label: "Household net income" },
      { value: "income_tax", label: "Income tax" },
      { value: "employment_income", label: "Employment income" }
    ]
  },
  uk: {
    id: "uk",
    label: "UK",
    description: "Universal Credit taper benchmark",
    incomeLabel: "Income points",
    incomeMax: 1001,
    currency: "GBP",
    defaultVariable: "universal_credit",
    variables: [
      { value: "universal_credit", label: "Universal Credit" },
      { value: "household_net_income", label: "Household net income" },
      { value: "income_tax", label: "Income tax" },
      { value: "employment_income", label: "Employment income" }
    ]
  }
};

export function getCountryConfig(country) {
  return COUNTRY_OPTIONS[country] || COUNTRY_OPTIONS.us;
}
