export default async (request: Request, context: any) => {
  return new Response(
    JSON.stringify({
      countryCode: context.geo?.country?.code ?? null,
      countryName: context.geo?.country?.name ?? null,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
};

export const config = {
  path: "/geo",
};