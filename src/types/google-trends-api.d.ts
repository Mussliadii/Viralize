declare module "google-trends-api" {
  interface RelatedQueriesOptions {
    keyword: string;
    geo?: string;
    hl?: string;
  }

  const googleTrends: {
    relatedQueries(options: RelatedQueriesOptions): Promise<string>;
  };

  export = googleTrends;
}
