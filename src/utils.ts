const regex = /(?<!\{)\{\{([^{}]+)\}\}(?!\})/g;
export const extractVariablesFromTemplate = (plainContent: string) => {
  const matches = plainContent.match(regex);
  if (!matches) {
    return [];
  }
  return matches.map((match) => match.slice(2, -2));
};

export const kebab2UpperCamel = (str: string) => {
  return (
    str.charAt(0).toUpperCase() +
    str.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
  );
};
