import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p", "br", "h1", "h2", "h3", "h4", "blockquote", "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "a", "img", "pre", "code", "hr"
];

export function cleanRichText(input: string) {
  return sanitizeHtml(input, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      pre: ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener noreferrer", target: "_blank" })
    },
    disallowedTagsMode: "discard"
  });
}

export function cleanPlainText(input: unknown, maxLength = 5000) {
  if (typeof input !== "string") return "";
  return input.replace(/\u0000/g, "").trim().slice(0, maxLength);
}
