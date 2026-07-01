import "@testing-library/jest-dom";

// jsdomにはURL.createObjectURLが実装されていないため、
// ImageUploaderなどファイルプレビューを行うコンポーネントのテストのためにモックを用意する
global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = jest.fn();
