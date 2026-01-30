import { SearchModal, type SearchPanelProps } from "@mprest/map";

const SearchPanel = ({ api, filters, entities }: SearchPanelProps) => {
  const {
    searchData,
    searchFilterData,
    isSearchModalOpen,
    searchResults,
    searchQuery,
    handleLayerToggle,
    handleTypeToggle,
    performSearch,
    closeSearchModal,
  } = api;

  return (
    <>
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        searchData={searchData}
        filterData={searchFilterData}
        globalFilterData={filters.filterData}
        searchResults={searchResults}
        searchQuery={searchQuery}
        onLayerToggle={handleLayerToggle}
        onTypeToggle={handleTypeToggle}
        onSearch={performSearch}
        onSelectEntity={entities.selectEntity}
      />
    </>
  );
};

export default SearchPanel;