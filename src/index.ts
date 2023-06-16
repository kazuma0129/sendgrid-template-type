import client from "@sendgrid/client";
import Response from "@sendgrid/helpers/classes/response";

import { generateTypeDefinition } from "./genType";
import { extractVariablesFromTemplate, kebab2UpperCamel } from "./utils";

type TemplateVersionContentBase = {
  id: string;
  template_id: string;
  active: 0 | 1;
  name: string;
  generate_plain_content: boolean;
  subject: string;
  updated_at: string;
  editor: string;
  thumbnail_url: string;
};

type TemplateVersionContentOne = TemplateVersionContentBase & {
  user_id: number;
  html_content: string;
  plain_content: string;
};

type TemplateVersionContentAll = TemplateVersionContentBase;

type TemplateResponse<
  T extends TemplateVersionContentOne | TemplateVersionContentAll
> = {
  id: string;
  name: string;
  generation: string;
  updated_at: string;
  versions: T[];
};

type TemplateOneResponse = TemplateResponse<TemplateVersionContentOne>;
type TemplateAllResponse = {
  result: TemplateResponse<TemplateVersionContentAll>[];
  _metadata: {
    self: string;
    count: number;
  };
};

const getSingle = async (
  templateId: string
): Promise<Response<TemplateOneResponse>> => {
  const [res] = await client.request({
    url: `/v3/templates/${templateId}`,
    method: "GET",
  });
  // FIXME: handle errors
  return res as Response<TemplateOneResponse>;
};

const getAll = async ({
  page_size = 10,
}: {
  generations?: string[];
  page_size?: number;
}): Promise<Response<TemplateAllResponse>> => {
  const [res] = await client.request({
    url: `/v3/templates`,
    method: "GET",
    qs: {
      generations: "dynamic", // need support for 'legacy'?
      page_size: page_size,
    },
  });
  // FIXME: handle errors
  return res as Response<TemplateAllResponse>;
};

export const genOne = async ({
  templateId,
  interfaceName,
}: {
  templateId: string;
  interfaceName?: string;
}): Promise<{ def: string; name: string }> => {
  const res = await getSingle(templateId);
  // FIXME: actually res is falsy
  const activeTemplateContent = res.body.versions.filter((t) => t.active)[0];
  const variables = extractVariablesFromTemplate(
    activeTemplateContent.plain_content
  );

  const name = interfaceName
    ? kebab2UpperCamel(interfaceName)
    : kebab2UpperCamel(activeTemplateContent.name);

  return {
    def: generateTypeDefinition({
      variables,
      interfaceName: name,
    }),
    name,
  };
};

export const genAll = async ({
  generations,
  page_size,
}: {
  generations?: string[];
  page_size?: number;
}): Promise<{ def: string; name: string; id: string }[]> => {
  const res = await getAll({ generations, page_size });
  const templates = res.body.result.map(({ id, name }) => ({
    id,
    name,
  }));

  const types = await Promise.all(
    templates.map(async ({ id, name }) => {
      const tempOne = await genOne({ templateId: id, interfaceName: name });
      return {
        def: tempOne.def,
        name: tempOne.name,
        id,
      };
    })
  );

  return types;
};
