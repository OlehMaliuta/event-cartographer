import React from "react";
import { Marker, Popup } from "react-leaflet";
import cl from './.module.css';
import { API_PORT, CLIENT_PORT, HOST } from '../../constants';
import { newMarkerIcon, lowImpMarkerIcon, mediumImpMarkerIcon, highImpMarkerIcon } from "../../map-icons";
import LoadingAnimation from '../../components/LoadingAnimation/LoadingAnimation';
import ascendingPng from '../../assets/sort-ascending.png';
import descendingPng from '../../assets/sort-descending.png';
import Map from "../../components/Map/Map";
import PageNavigator from "../../components/PageNavigator/PageNavigator";
import MarkerListElement from "../../components/MarkerListElement/MarkerListElement";
import { useTranslation } from "react-i18next";

const MainLayout = () => {
    const { t } = useTranslation();

    const [newMarker, setNewMarker] = React.useState(null);
    const [editingMarker, setEditingMarker] = React.useState(null);
    const [markerListPage, setMarkerListPage] = React.useState(1);
    const [markerListPageCount, setMarkerListPageCount] = React.useState(0);
    const [mapBounds, setMapBounds] = React.useState(null);

    const [userInfo, setUserInfo] = React.useState(null);
    const [markersForMap, setMarkersForMap] = React.useState(null);
    const [markersForList, setMarkersForList] = React.useState(null);
    const [currentMarkerMenu, setMarkerMenu] = React.useState(null);
    const [isMarkerPanelVisible, setMarkerPanelVisibility] = React.useState(false);
    const [isMarkerListFilterVisible, setMarkerListFilterVisibility] = React.useState(false);

    const [markersForMapLoading, setMarkersForMapLoading] = React.useState(false);
    const [markersForListLoading, setMarkersForListLoading] = React.useState(false);
    const [updatingMarkerList, setUpdatingMarkerList] = React.useState(false);

    const [markerListSort, setMarkerListSort] = React.useState({ type: 'importance', asc: false });
    const [markerListImportanceFilter, setMarkerListImportanceFilter] = React.useState([]);
    const [markerListTimeOfStartFilter, setMarkerListTimeOfStartFilter] = React.useState({ min: undefined, max: undefined });

    const mapRef = React.useRef(null);

    const markerSearchInputRef = React.useRef(null);

    const latitudeInputRef = React.useRef(null);
    const longitudeInputRef = React.useRef(null);
    const startsAtInputRef = React.useRef(null);
    const importanceInputRef = React.useRef(null);
    const titleInputRef = React.useRef(null);
    const descriptionInputRef = React.useRef(null);

    function getImportanceIcon(importance) {
        switch (importance) {
            case 'low':
                return lowImpMarkerIcon;
            case 'medium':
                return mediumImpMarkerIcon;
            case 'high':
                return highImpMarkerIcon;
            default:
                return undefined;
        }
    }

    function getDateTimeLocalFormat(dateTime) {
        if (!dateTime) {
            return null;
        }

        const processedDateTime = new Date(dateTime);
        processedDateTime.setMinutes(processedDateTime.getMinutes() - processedDateTime.getTimezoneOffset());
        return processedDateTime.toISOString().slice(0, 19);
    }

    async function loadUserInfo() {
        const response = await fetch(`${HOST}:${API_PORT}/api/users/self`, {
            method: "GET",
            mode: "cors",
            credentials: "include"
        });
        const json = await response.json();

        setUserInfo(json.data || undefined);
    }

    async function logOutRequest() {
        const response = await fetch(`${HOST}:${API_PORT}/api/users/logout`, {
            method: "GET",
            mode: "cors",
            credentials: "include"
        });
        const json = await response.json();

        if (response.ok) {
            window.location.href = `${HOST}:${CLIENT_PORT}/sign-in`;
        } else if (!response.ok) {
            if (json.message) {
                alert(t(json.message));
            } else {
                let errors = "";
                for (const prop in json.errors) {
                    for (const err in json.errors[prop]) {
                        errors += `${t(json.errors[prop][err])}\n`;
                    }
                }
                errors = errors.slice(0, -1);
                alert(errors);
            }
        } else if (response.status >= 500 && response.status <= 599) {
            alert(t('general.server-error'));
        }
    }

    async function addMarkerRequest() {
        setUpdatingMarkerList(true);

        const response = await fetch(`${HOST}:${API_PORT}/api/markers`, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                latitude: Number(latitudeInputRef.current.value) || null,
                longitude: Number(longitudeInputRef.current.value) || null,
                startsAt: new Date(startsAtInputRef.current.value) || null,
                importance: importanceInputRef.current.value || null,
                title: titleInputRef.current.value || null,
                description: descriptionInputRef.current.value || null
            })
        });
        const json = await response.json();

        if (response.ok) {
            loadMarkersForMap(mapBounds);
            loadMarkersForList(1);
            setMarkerMenu('list');
            setNewMarker(null);
        } else if (!response.ok) {
            if (json.message) {
                alert(t(json.message));
            } else {
                let errors = "";
                for (const prop in json.errors) {
                    for (const err in json.errors[prop]) {
                        errors += `${t(json.errors[prop][err])}\n`;
                    }
                }
                errors = errors.slice(0, -1);
                alert(errors);
            }
        } else if (response.status >= 500 && response.status <= 599) {
            alert(t('general.server-error'));
        }

        setUpdatingMarkerList(false);
    }

    async function editMarkerRequest() {
        setUpdatingMarkerList(true);

        const response = await fetch(`${HOST}:${API_PORT}/api/markers/${editingMarker.id}`, {
            method: "PUT",
            mode: "cors",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                latitude: Number(latitudeInputRef.current.value) || null,
                longitude: Number(longitudeInputRef.current.value) || null,
                startsAt: new Date(startsAtInputRef.current.value) || null,
                importance: importanceInputRef.current.value || null,
                title: titleInputRef.current.value || null,
                description: descriptionInputRef.current.value || null
            })
        });
        const json = await response.json();

        if (response.ok) {
            loadMarkersForMap(mapBounds);
            loadMarkersForList(1);
            setMarkerMenu('list');
            setEditingMarker(null);
        } else if (!response.ok) {
            if (json.message) {
                alert(t(json.message));
            } else {
                let errors = "";
                for (const prop in json.errors) {
                    for (const err in json.errors[prop]) {
                        errors += `${t(json.errors[prop][err])}\n`;
                    }
                }
                errors = errors.slice(0, -1);
                alert(errors);
            }
        } else if (response.status >= 500 && response.status <= 599) {
            alert(t('general.server-error'));
        }

        setUpdatingMarkerList(false);
    }

    function renderMarkerList() {
        const displayMarkerList = () => {
            const result = [];

            markersForList?.forEach((el, idx) => {
                result.push(
                    <MarkerListElement
                        key={idx}
                        marker={el}
                        navigate={navigateToMarker}
                        edit={editMarker}
                        remove={removeMarkerRequest} />
                );
            });

            return result;
        }

        return (
            <>
                <div className={`${cl.marker_list_panel}`}>
                    <div className={cl.marker_list_panel__search}>
                        <input
                            className={`${cl.marker_list_search_input}`}
                            type='text'
                            placeholder={t('map.search-markers-input')}
                            ref={markerSearchInputRef} />
                        <button className={`${cl.marker_list_apply_button}`}
                            onClick={() => {
                                if (!markersForListLoading) {
                                    loadMarkersForList(1);
                                }
                            }}>
                            <img className={cl.marker_list_apply_button__img}
                                alt="search" />
                        </button>
                    </div>
                    <div className={`${cl.marker_list_sort_and_filter_cont}`}>
                        <span className={`${cl.marker_list_sort_label}`}>
                            {t('map.sorting-label')}
                        </span>
                        <select className={`${cl.marker_list_sort_input}`}
                            value={markerListSort.type}
                            onChange={(e) => {
                                setMarkerListSort(p => {
                                    let newP = { ...p };
                                    newP.type = e.target.value;
                                    return newP;
                                });
                            }}>
                            <option className={`${cl.marker_list_sort_input_option}`} value='importance'>
                                {t('map.sort-by-importance-value')}
                            </option>
                            <option className={`${cl.marker_list_sort_input_option}`} value='title'>
                                {t('map.sort-by-title-value')}
                            </option>
                            <option className={`${cl.marker_list_sort_input_option}`} value='startsAt'>
                                {t('map.sort-by-time-value')}
                            </option>
                        </select>
                        <button className={`${cl.marker_list_sort_direction_button}`}
                            onClick={() => {
                                setMarkerListSort(p => {
                                    let newP = { ...p };
                                    newP.asc = !newP.asc;
                                    return newP;
                                });
                            }}>
                            <img
                                className={`${cl.marker_list_direction_button_img}`}
                                src={markerListSort.asc ? ascendingPng : descendingPng}
                                alt='sort direction' />
                        </button>
                        <button className={`${cl.marker_list_filter_button}`}
                            onClick={() => { setMarkerListFilterVisibility(p => !p) }}>
                            <img className={`${cl.marker_list_filter_button_img}`} alt='filter' />
                        </button>
                    </div>
                    <div className={`${cl.marker_list_filter_panel_cont}`} style={{ height: isMarkerListFilterVisible ? 'fit-content' : '0px' }}>
                        <div className={`${cl.marker_list_filter_panel}`}>
                            <div className={`${cl.marker_list_filter_panel_importance_cont}`}>
                                <h3 className={`${cl.marker_list_filter_panel_importance_header}`}>
                                    {t('map.importance-filter-title')}
                                </h3>
                                <div className={`${cl.marker_list_filter_panel_importance}`}>
                                    <div className={`${cl.marker_list_filter_panel_importance_checkbox_cont}`}>
                                        <input
                                            className={`${cl.marker_list_filter_panel_importance_checkbox_low} ${cl.marker_list_filter_panel_importance_checkbox}`}
                                            type='checkbox'
                                            checked={markerListImportanceFilter.includes('low')}
                                            onChange={() => {
                                                setMarkerListImportanceFilter(p => {
                                                    const impValue = 'low';
                                                    let newP = [...p];

                                                    if (newP.includes(impValue)) {
                                                        newP = newP.filter(el => el !== impValue);
                                                    } else {
                                                        newP.push(impValue);
                                                    }

                                                    return newP;
                                                });
                                            }} />
                                        <span
                                            className={`${cl.marker_list_filter_panel_importance_label_low} ${cl.marker_list_filter_panel_importance_label}`}
                                        >{t('map.low-importance-value')}</span>
                                    </div>
                                    <div className={`${cl.marker_list_filter_panel_importance_checkbox_cont}`}>
                                        <input
                                            className={`${cl.marker_list_filter_panel_importance_checkbox_medium} ${cl.marker_list_filter_panel_importance_checkbox}`}
                                            type='checkbox'
                                            checked={markerListImportanceFilter.includes('medium')}
                                            onChange={() => {
                                                setMarkerListImportanceFilter(p => {
                                                    const impValue = 'medium';
                                                    let newP = [...p];

                                                    if (newP.includes(impValue)) {
                                                        newP = newP.filter(el => el !== impValue);
                                                    } else {
                                                        newP.push(impValue);
                                                    }

                                                    return newP;
                                                });
                                            }} />
                                        <span
                                            className={`${cl.marker_list_filter_panel_importance_label_medium} ${cl.marker_list_filter_panel_importance_label}`}
                                        >{t('map.medium-importance-value')}</span>
                                    </div>
                                    <div className={`${cl.marker_list_filter_panel_importance_checkbox_cont}`}>
                                        <input
                                            className={`${cl.marker_list_filter_panel_importance_checkbox_high} ${cl.marker_list_filter_panel_importance_checkbox}`}
                                            type='checkbox'
                                            checked={markerListImportanceFilter.includes('high')}
                                            onChange={() => {
                                                setMarkerListImportanceFilter(p => {
                                                    const impValue = 'high';
                                                    let newP = [...p];

                                                    if (newP.includes(impValue)) {
                                                        newP = newP.filter(el => el !== impValue);
                                                    } else {
                                                        newP.push(impValue);
                                                    }

                                                    return newP;
                                                });
                                            }} />
                                        <span
                                            className={`${cl.marker_list_filter_panel_importance_label_high} ${cl.marker_list_filter_panel_importance_label}`}
                                        >{t('map.high-importance-value')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`${cl.marker_list_filter_panel_sep_line_cont}`}>
                                <div className={`${cl.marker_list_filter_panel_sep_line}`} />
                            </div>
                            <div className={`${cl.marker_list_filter_panel_starts_at_cont}`}>
                                <h3 className={`${cl.marker_list_filter_panel_starts_at_header}`}>
                                    {t('map.time-of-the-start-filter-title')}
                                </h3>
                                <div className={`${cl.marker_list_filter_panel_starts_at}`}>
                                    <input
                                        className={`${cl.marker_list_filter_panel_starts_at_min} ${cl.marker_list_filter_panel_starts_at_input}`}
                                        type='datetime-local'
                                        value={getDateTimeLocalFormat(markerListTimeOfStartFilter.min) ?? ''}
                                        onChange={(e) => {
                                            setMarkerListTimeOfStartFilter(p => {
                                                const newP = { ...p };
                                                newP.min = e.target.value;
                                                return newP;
                                            });
                                        }} />
                                    <div className={`${cl.marker_list_filter_panel_starts_at_sep_line_cont}`}>
                                        <div className={`${cl.marker_list_filter_panel_starts_at_sep_line}`} />
                                    </div>
                                    <input
                                        className={`${cl.marker_list_filter_panel_starts_at_max} ${cl.marker_list_filter_panel_starts_at_input}`}
                                        type='datetime-local'
                                        value={getDateTimeLocalFormat(markerListTimeOfStartFilter.max) ?? ''}
                                        onChange={(e) => {
                                            setMarkerListTimeOfStartFilter(p => {
                                                const newP = { ...p };
                                                newP.max = e.target.value;
                                                return newP;
                                            });
                                        }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {
                    markersForListLoading ?
                        <div className={`${cl.marker_list_loading}`}>
                            <LoadingAnimation size="50px" curveWidth="10px" />
                        </div>
                        :
                        <>
                            <div className={`${cl.marker_list}`}>
                                {displayMarkerList()}
                            </div>
                            <PageNavigator
                                currentPage={markerListPage}
                                pageCount={markerListPageCount}
                                loadData={loadMarkersForList} />
                        </>
                }
            </>
        );
    }

    function renderMenuForMarkerEditing() {
        const isForAdding = currentMarkerMenu === 'add';

        return (
            <>
                <div className={cl.editing_marker_coordinates}>
                    <div className={`${cl.editing_marker_coordinate} ${cl.editing_marker_latitude}`}>
                        <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_latitude_label}`}>
                            {t('map.marker-edit-latitude-label')}
                        </p>
                        <input
                            className={`${cl.editing_marker_field_input} ${cl.editing_marker_latitude_input}`}
                            value={isForAdding ? newMarker.latitude : editingMarker.latitude}
                            type='number'
                            ref={latitudeInputRef}
                            onChange={(e) => {
                                if (isForAdding) {
                                    setNewMarker(p => {
                                        let newP = { ...p };
                                        newP.latitude = e.target.value;
                                        return newP;
                                    });
                                } else {
                                    setEditingMarker(p => {
                                        let newP = { ...p };
                                        newP.latitude = e.target.value;
                                        return newP;
                                    });
                                }
                            }}
                        />
                    </div>
                    <div className={`${cl.editing_marker_coordinate} ${cl.editing_marker_longitude}`}>
                        <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_longitude_label}`}>
                            {t('map.marker-edit-longitude-label')}
                        </p>
                        <input
                            className={`${cl.editing_marker_field_input} ${cl.editing_marker_longitude_input}`}
                            value={isForAdding ? newMarker.longitude : editingMarker.longitude}
                            type='number'
                            ref={longitudeInputRef}
                            onChange={(e) => {
                                if (isForAdding) {
                                    setNewMarker(p => {
                                        let newP = { ...p };
                                        newP.longitude = e.target.value;
                                        return newP;
                                    });
                                } else {
                                    setEditingMarker(p => {
                                        let newP = { ...p };
                                        newP.longitude = e.target.value;
                                        return newP;
                                    });
                                }
                            }}
                        />
                    </div>
                </div>
                <div className={cl.editing_marker_time_and_importance}>
                    <div className={`${cl.editing_marker_starts_at}`}>
                        <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_starts_at_label}}`}>
                            {t('map.marker-edit-starts-at-label')}
                        </p>
                        <input
                            className={`${cl.editing_marker_field_input} ${cl.editing_marker_starts_at_input}`}
                            type='datetime-local'
                            defaultValue={isForAdding ? undefined : getDateTimeLocalFormat(editingMarker.startsAt)}
                            ref={startsAtInputRef} />
                    </div>
                    <div className={`${cl.editing_marker_importance}`}>
                        <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_importance_label}`}>
                            {t('map.marker-edit-importance-label')}
                        </p>
                        <select
                            className={`${cl.editing_marker_field_input} ${cl.editing_marker_importance_input}`}
                            defaultValue={isForAdding ? undefined : editingMarker.importance}
                            ref={importanceInputRef}>
                            <option className={cl.editing_marker_importance_input__low_value} value='low'>
                                {t('map.low-importance-value')}
                            </option>
                            <option className={cl.editing_marker_importance_input__medium_value} value='medium'>
                                {t('map.medium-importance-value')}
                            </option>
                            <option className={cl.editing_marker_importance_input__high_value} value='high'>
                                {t('map.high-importance-value')}
                            </option>
                        </select>
                    </div>
                </div>
                <div className={`${cl.editing_marker_title}`}>
                    <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_title_label}}`}>
                        {t('map.marker-edit-title-label')}
                    </p>
                    <input
                        className={`${cl.editing_marker_field_input} ${cl.editing_marker_title_input}`}
                        type='text'
                        maxLength='100'
                        defaultValue={isForAdding ? undefined : editingMarker.title}
                        ref={titleInputRef} />
                </div>
                <div className={`${cl.editing_marker_description}`}>
                    <p className={`${cl.editing_marker_field_label} ${cl.editing_marker_description_label}}`}>
                        {t('map.marker-edit-description-label')}
                    </p>
                    <textarea
                        className={`${cl.editing_marker_field_input} ${cl.editing_marker_description_input}`}
                        maxLength='5000'
                        defaultValue={isForAdding ? undefined : editingMarker.description}
                        ref={descriptionInputRef}></textarea>
                </div>
                {
                    isForAdding ?
                        <div className={`${cl.editing_marker_buttons}`}>
                            <button className={`${cl.editing_marker_button} ${cl.editing_marker_cancel_button}`}
                                onClick={() => {
                                    setNewMarker(null);
                                    setMarkerMenu('list');
                                }}>
                                {t('map.cancel-marker-adding')}
                            </button>
                            <button className={`${cl.editing_marker_button} ${cl.editing_marker_add_button}`}
                                onClick={() => {
                                    if (!updatingMarkerList) {
                                        addMarkerRequest();
                                    }
                                }}>
                                {
                                    updatingMarkerList ?
                                        <LoadingAnimation
                                            curveColor1="#FFFFFF"
                                            curveColor2="#00000000"
                                            size="15px"
                                            curveWidth="3px" />
                                        :
                                        <span>
                                            {t('map.add-marker')}
                                        </span>
                                }
                            </button>
                        </div>
                        :
                        <div className={`${cl.editing_marker_buttons}`}>
                            <button className={`${cl.editing_marker_button} ${cl.editing_marker_go_back_button}`}
                                onClick={() => {
                                    setEditingMarker(null);
                                    setMarkerMenu('list');
                                }}>
                                {t('map.go-to-the-list')}
                            </button>
                            <button className={`${cl.editing_marker_button} ${cl.editing_marker_edit_button}`}
                                onClick={() => {
                                    if (!updatingMarkerList) {
                                        editMarkerRequest();
                                    }
                                }}>
                                {
                                    updatingMarkerList ?
                                        <LoadingAnimation
                                            curveColor1="#FFFFFF"
                                            curveColor2="#00000000"
                                            size="15px"
                                            curveWidth="3px" />
                                        :
                                        <span>
                                            {t('map.edit-marker')}
                                        </span>
                                }
                            </button>
                        </div>
                }
            </>
        );
    }

    const loadMarkersForList = React.useCallback(async (page) => {
        setMarkersForListLoading(true);

        let url = `${HOST}:${API_PORT}/api/markers/search`;
        url += '?page_size=10';
        url += `&page=${page || '1'}`;
        url += `&q=${markerSearchInputRef.current?.value || ''}`;
        url += `&sort_type=${markerListSort.type}`;
        url += `&sort_by_asc=${markerListSort.asc}`;
        url += `&min_time=${getDateTimeLocalFormat(markerListTimeOfStartFilter.min) ?? ''}`;
        url += `&max_time=${getDateTimeLocalFormat(markerListTimeOfStartFilter.max) ?? ''}`;

        markerListImportanceFilter.forEach(el => {
            url += `&imp=${el}`
        });

        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            credentials: "include"
        });
        const json = await response.json();

        setMarkersForList(json.data.items || []);
        setMarkerListPage(page || 1);
        setMarkerListPageCount(json.data.pageCount || 0);
        setMarkersForListLoading(false);
    }, [markerListTimeOfStartFilter.max, markerListTimeOfStartFilter.min, markerListImportanceFilter, markerListSort.asc, markerListSort.type]);

    const loadMarkersForMap = React.useCallback(async (bounds) => {
        setMarkersForMapLoading(true);

        let url = `${HOST}:${API_PORT}/api/markers/map`;
        url += `?n_e_lat=${bounds.getNorthEast().lat}`;
        url += `&n_e_long=${bounds.getNorthEast().lng}`;
        url += `&s_w_lat=${bounds.getSouthWest().lat}`;
        url += `&s_w_long=${bounds.getSouthWest().lng}`;

        const response = await fetch(url, {
            method: "GET",
            mode: "cors",
            credentials: "include"
        });
        const json = await response.json();

        setMarkersForMap(json.data || []);

        setMarkersForMapLoading(false);
    }, []);

    const removeMarkerRequest = React.useCallback(async (marker) => {
        const response = await fetch(`${HOST}:${API_PORT}/api/markers/${marker.id}`, {
            method: "DELETE",
            mode: "cors",
            credentials: "include"
        });
        const json = await response.json();

        if (response.ok) {
            setMarkersForMap(markersForList.filter(x => x.id !== marker.id));
            loadMarkersForList(1);
        } else if (!response.ok) {
            if (json.message) {
                alert(t(json.message));
            } else {
                let errors = "";
                for (const prop in json.errors) {
                    for (const err in json.errors[prop]) {
                        errors += `${t(json.errors[prop][err])}\n`;
                    }
                }
                errors = errors.slice(0, -1);
                alert(errors);
            }
        } else if (response.status >= 500 && response.status <= 599) {
            alert(t('general.server-error'));
        }
    }, [loadMarkersForList, markersForList, t]);

    const navigateToMarker = React.useCallback((marker) => {
        mapRef.current.flyTo([marker.latitude, marker.longitude], 13);
    }, []);

    const editMarker = React.useCallback((marker) => {
        setMarkerMenu('edit');
        setEditingMarker(marker);
    }, []);

    const mapLoadEvent = React.useCallback((map) => {
        loadMarkersForMap(map.getBounds());
        setMapBounds(map.getBounds());
    }, [loadMarkersForMap]);

    const mapClickEvent = React.useCallback((e) => {
        setNewMarker({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
        });

        setMarkerMenu('add');
        setMarkerPanelVisibility(true);
    }, []);

    const mapMoveendEvent = React.useCallback(() => {
        const bounds = mapRef.current?.getBounds();

        if (!bounds) {
            return;
        }

        loadMarkersForMap(bounds);
        setMapBounds(bounds);
    }, [loadMarkersForMap]);

    const renderMarkersOnMap = React.useCallback(() => {
        const result = [];

        if (newMarker !== null) {
            result.push(
                <Marker
                    key={'new'}
                    position={[newMarker.latitude, newMarker.longitude]}
                    icon={newMarkerIcon}>
                    <Popup>
                        <button className={`${cl.marker_popup_cancel_button}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setNewMarker(null);
                                setMarkerMenu('list');
                            }}>{t('map.cancel-marker-adding')}</button>
                    </Popup>
                </Marker>
            );
        }

        markersForMap?.forEach(el => {
            result.push(
                <Marker
                    key={el.id}
                    position={[el.latitude, el.longitude]}
                    icon={getImportanceIcon(el.importance)}>
                    <Popup>
                        <div className={cl.marker_popup_cont}>
                            <h2 className={cl.marker_popup_title}>{el.title}</h2>
                            <p className={cl.marker_popup_description}>{el.description}</p>
                            <p className={cl.marker_popup_starts_at}>{new Date(el.startsAt).toLocaleString()}</p>
                        </div>
                    </Popup>
                </Marker>
            );
        });

        return result;
    }, [newMarker, markersForMap, t]);

    React.useEffect(() => {
        loadUserInfo();
    }, []);

    React.useEffect(() => {
        loadMarkersForList(1);
    }, [loadMarkersForList]);

    return (
        <div className={cl.main}>
            <Map
                load={mapLoadEvent}
                click={mapClickEvent}
                moveend={mapMoveendEvent}
                renderMarkers={renderMarkersOnMap}
                ref={mapRef} />
            <div className={`${cl.right_side_menu} ${isMarkerPanelVisible ? '' : cl.hided}`}>
                <div className={`${cl.right_side_menu__user_name__cont}`}>
                    <span className={`${cl.right_side_menu__user_name}`}>{userInfo?.name}</span>
                </div>
                <button className={`${cl.right_side_menu__marker_menu_button}`}
                    onClick={() => {
                        if (!isMarkerPanelVisible && currentMarkerMenu === null) {
                            setMarkerMenu('list');
                        }
                        setMarkerPanelVisibility(p => !p);
                    }}>
                    <img className={`${cl.right_side_menu__marker_menu_button__img}`}
                        alt='marker menu' />
                </button>
                <button className={`${cl.right_side_menu__settings_button}`}
                    onClick={() => window.location.href = `${HOST}:${CLIENT_PORT}/settings`}>
                    <img className={`${cl.right_side_menu__settings_button__img}`}
                        alt='settings' />
                </button>
                <button className={`${cl.right_side_menu__log_out_button}`}
                    onClick={logOutRequest}>
                    <img className={`${cl.right_side_menu__log_out_button__img}`}
                        alt='log out' />
                </button>
                {
                    markersForMapLoading ?
                        <div className={cl.map_markers_loading}>
                            <LoadingAnimation
                                curveColor1="#FFFFFF"
                                curveColor2="#000000"
                                size="28px"
                                curveWidth="5px" />
                        </div>
                        : <></>
                }
            </div>
            <div className={`${cl.marker_panel} ${isMarkerPanelVisible ? '' : cl.hided}`}>
                <div className={`${cl.marker_panel__top_menu}`}>
                    <div className={
                        `${cl.marker_panel__top_menu__option} 
                            ${newMarker === null ? cl.unavailable : ''} 
                            ${currentMarkerMenu === 'add' ? cl.current : ''}`}
                        onClick={() => {
                            if (newMarker) {
                                setMarkerMenu('add');
                            }
                        }}>
                        <img className={`${cl.marker_panel__top_menu__option_img} ${cl.new_marker_img}`}
                            alt="add" />
                    </div>
                    <div
                        className={
                            `${cl.marker_panel__top_menu__option} 
                            ${currentMarkerMenu === 'list' || currentMarkerMenu === 'edit' ? cl.current : ''}`}
                        onClick={() => setMarkerMenu('list')}>
                        <img className={`${cl.marker_panel__top_menu__option_img} ${cl.marker_list_img}`} />
                    </div>
                </div>
                {isMarkerPanelVisible && currentMarkerMenu === 'list' ? renderMarkerList() : <></>}
                {isMarkerPanelVisible && ['add', 'edit'].includes(currentMarkerMenu) ? renderMenuForMarkerEditing() : <></>}
            </div>
        </div>
    );
};

export default MainLayout;
