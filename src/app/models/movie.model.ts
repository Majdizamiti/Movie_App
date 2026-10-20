export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate: string;
  voteAverage: number;
  genreIds?: number[];
  createdBy?: string;
  createdAt?: number;
}
