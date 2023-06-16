import { promises as fs } from "fs";

type Node = {
  [key: string]: Node;
};

const buildTree = (variables: string[]): Node => {
  const root: Node = {};

  for (const variable of variables) {
    const splitVariable = variable.split(".");
    let current = root;
    for (const part of splitVariable) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  return root;
};

const generateTypeDefinition = (node: Node, indent = ""): string => {
  let output = "{\n";

  for (const key in node) {
    const value = node[key];
    const inner = generateTypeDefinition(value, indent + "  ");
    output += `${indent}  ${key}: ${
      Object.keys(value).length > 0 ? inner : "string"
    };\n`;
  }

  output += indent + "}";

  return output;
};

export const generateTypeDefinitionFile = ({
  interfaceName,
  variables,
}: {
  interfaceName: string;
  variables: string[];
}): string => {
  const tree = buildTree(variables);
  const typeDefinition = `interface ${interfaceName} ${generateTypeDefinition(
    tree
  )}\n`;

  return typeDefinition;
};
