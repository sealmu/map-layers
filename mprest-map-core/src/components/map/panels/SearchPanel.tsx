import SearchModal from "./SearchModal";
import type { ISearchPanelProps } from "../../../types";

type SearchPanelProps = ISearchPanelProps;

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