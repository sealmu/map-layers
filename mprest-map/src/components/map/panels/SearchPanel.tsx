import { SearchModal, type SearchPanelProps } from "@mprest/map";

const SearchPanel = ({ api }: SearchPanelProps) => {
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
  } = api.searchPanel;

  return (
    <>
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        searchData={searchData}
        filterData={searchFilterData}
        globalFilterData={api.filtersPanel.filterData}
        searchResults={searchResults}
        searchQuery={searchQuery}
        onLayerToggle={handleLayerToggle}
        onTypeToggle={handleTypeToggle}
        onSearch={performSearch}
        onSelectEntity={api.entities.selectEntity}
      />
    </>
  );
};

export default SearchPanel;