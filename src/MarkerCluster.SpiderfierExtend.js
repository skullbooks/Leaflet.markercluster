/**
 * @file
 * @version 0.1
 * @author Jan-Victor Krille <jan-victor.krille@cn-consult.eu>
 */

L.MarkerClusterGroup.include({

	currentSpidered: null,
	currentPopup: null,
	spiderAnimations: true,

	_unspiderfyWrapper: function () {
		/// <summary>_unspiderfy but passes no arguments</summary>
		if (this.spiderAnimations)
		{
			this._unspiderfy();
		}
		else
		{
			this._noanimationUnspiderfy();
		}
	},

	/**
	 * Initial method to enable stuff we need for the extended spiderfier functionality.
	 */
	_initSpiderfierExtend: function ()
	{
		var map = this._map;

		console.log("### initSpiderfierExtend ###", this);

		this.on('spiderfied', function (_event) {
			console.log("FE spiderfied");
			this._setCurrentSpidered(_event.target._spiderfied);
		});

		map.on("popupopen", function (_popup) {
			this._setCurrentPopup(_popup);
		}, this);

		map.on("popupclose", function () {
			// @todo we have no refreshing state at this time!!!
			if (!this.refreshing)
			{
				this._clearCurrentPopup();
			}
		}, this);

		map.on('click', function () {
			this._clearCurrentSpidered();
		}, this);

		map.on('zoomstart', function () {
			var currentSpidered = this._getCurrentSpidered();

			if (currentSpidered)
			{
				this.spiderAnimations = false;
				currentSpidered._noanimationUnspiderfy();
			}
		}, this);

		map.on('zoomend', function () {
			console.log("FE zoomend");
			var currentSpidered = this._getCurrentSpidered();

			if (currentSpidered && this._zoom !== currentSpidered._zoom)
			{
				var newClusterAtCurrentZoom = null;

				if (this._zoom > currentSpidered._zoom)
				{
					newClusterAtCurrentZoom = currentSpidered.getChildClusterAtZoomLevel(this._zoom);
				}
				else if (this._zoom < currentSpidered._zoom)
				{
					newClusterAtCurrentZoom = currentSpidered.getParentClusterAtZoomLevel(this._zoom);
				}

				if (newClusterAtCurrentZoom)
				{
					newClusterAtCurrentZoom.noAnimationSpiderfy();
					// @todo reopen popup
				}
				else
				{
					this._clearCurrentSpidered();
				}

				this.spiderAnimations = true;
			}
		}, this);
	},

	/**
	 * Saves the given current spidered cluster in a private member.
	 * @param {L.MarkerCluster} _clusterLayer The cluster to save.
	 * @private
	 */
	_setCurrentSpidered: function (_clusterLayer)
	{
		this.currentSpidered = _clusterLayer;
	},

	/**
	 * Returns the saved current spidered cluster.
	 * @returns  {L.MarkerCluster|null} The saved cluster or null.
	 * @private
	 */
	_getCurrentSpidered: function ()
	{
		return this.currentSpidered;
	},

	/**
	 * Clears the saved current spidered cluster.
	 * @private
	 */
	_clearCurrentSpidered: function ()
	{
		this.currentSpidered = null;
	},

	/**
	 * Saves the given popup that was probably opened.
	 * @param {L.Popup} _popup The popup to save.
	 * @private
	 */
	_setCurrentPopup: function (_popup)
	{
		this.currentPopup = _popup;
	},

	/**
	 * Returns the saved popup.
	 * @returns  {L.Popup|null} The saved popup or null.
	 * @private
	 */
	_getCurrentPopup: function ()
	{
		return this.currentPopup;
	},

	/**
	 * Clears the saved popup.
	 * @private
	 */
	_clearCurrentPopup: function ()
	{
		this.currentPopup = null;
	},

	/**
	 *
	 * @private
	 */
	_restoreState: function ()
	{
		console.log("Do all the cool and magic restore state stuff!");



/*
		// restore spiderfied cluster
		if (this.currentSpidered)
		{
			var cluster = this.findClusterOnPosition(this.currentSpidered.getLatLng());
			//console.log("FOUND cluster", cluster);
			if (cluster && cluster.spiderfy && typeof cluster.spiderfy == "function")
			{
				setTimeout(function() {
					cluster.spiderfy();
				}, 250);
			}
			else
			{
				// @todo there is some leaflet bug that in this case the marker disappears for a while ?
				this.clearCurrentSpidered()
			}
		}

		// restore popup
		if (this.currentPopup)
		{

			var marker = this.findMarker(this.currentPopup);
			//console.log("FOUND marker", marker);

			if (marker)
			{
				var possibleCluster = this.findClusterOnPosition(marker.getLatLng());
				if (possibleCluster && possibleCluster.spiderfy && typeof possibleCluster.spiderfy == "function")
				{
					//console.log("open cluster and popup", possibleCluster, marker);
					setTimeout(function() {
						possibleCluster.spiderfy();
						marker.openPopup();
					}, 250);
				}
				else
				{
					//console.log("just popup", marker);
					setTimeout(function() {
						marker.openPopup();
					}, 220);
				}
			}

		}

		this.refreshing = false;


*/




	},

	/**
	 *
	 * @param _layers
	 */
	updateLayers: function (_layers)
	{
		this.clearLayers();
		for (var i = 0; i < _layers.length; i++)
		{
			this.addLayer(_layers[i]);
		}
		this._restoreState();
	},

	/**
	 *
	 * @param _layer
	 */
	updateLayer: function (_layer)
	{
		this.updateLayers([_layer]);
	}

});

L.MarkerCluster.include({

	_noanimationSpiderfy: function (childMarkers, positions) {
		var group = this._group,
			map = group._map,
			i, m, leg, newPos;

		for (i = childMarkers.length - 1; i >= 0; i--) {
			newPos = map.layerPointToLatLng(positions[i]);
			m = childMarkers[i];

			m._preSpiderfyLatlng = m._latlng;
			m.setLatLng(newPos);
			m.setZIndexOffset(1000000); //Make these appear on top of EVERYTHING

			L.FeatureGroup.prototype.addLayer.call(group, m);


			leg = new L.Polyline([this._latlng, newPos], { weight: 1.5, color: '#222' });

			map.addLayer(leg);
			m._spiderLeg = leg;

			if (L.Path.SVG && this.SVG_ANIMATION)
			{ // fake a animation xml element that this can unspidered with animation
				var length = leg._path.getTotalLength();
				var xmlns = L.Path.SVG_NS;
				var anim = document.createElementNS(xmlns, "animate");
				anim.setAttribute("attributeName", "stroke-dashoffset");
				anim.setAttribute("begin", "indefinite");
				anim.setAttribute("from", length);
				anim.setAttribute("to", 0);
				anim.setAttribute("dur", 0.25);
				leg._path.appendChild(anim);

				anim = document.createElementNS(xmlns, "animate");
				anim.setAttribute("attributeName", "stroke-opacity");
				anim.setAttribute("begin", "indefinite");
				anim.setAttribute("from", 0);
				anim.setAttribute("to", 0.5);
				anim.setAttribute("dur", 0.25);
				leg._path.appendChild(anim);
			}

		}
		this.setOpacity(0.3);
		group.fire('spiderfied');
	},

	noAnimationSpiderfy: function () {
		if (this._group._spiderfied === this) {
			return;
		}

		var childMarkers = this.getAllChildMarkers(),
			group = this._group,
			map = group._map,
			center = map.latLngToLayerPoint(this._latlng),
			positions;

		this._group._unspiderfy();
		this._group._spiderfied = this;

		//TODO Maybe: childMarkers order by distance to center

		if (childMarkers.length >= this._circleSpiralSwitchover) {
			positions = this._generatePointsSpiral(childMarkers.length, center);
		} else {
			center.y += 10; //Otherwise circles look wrong
			positions = this._generatePointsCircle(childMarkers.length, center);
		}

		this._noanimationSpiderfy(childMarkers, positions);
	},

	/**
	 * Checks if the child markers of a cluster group are on the same position.
	 * @returns {boolean}
	 */
	childrenAreOnSamePosition: function ()
	{
		// @todo Make this some how configurable that the positions does not have to be exactly the same!
		return (this._bounds.getNorthWest().toString() === this._bounds.getSouthEast().toString());
	},

	/**
	 *
	 * @param _zoomLevel
	 * @returns {null}
	 */
	getChildClusterAtZoomLevel: function (_zoomLevel)
	{
		var childMarker = null,
			loop = true,
			marker = this;

		do {
			marker = marker._childClusters[0];
			if (marker._zoom === _zoomLevel)
			{
				childMarker = marker;
				loop = false;
			}
			else if (marker._zoom > _zoomLevel)
			{
				loop = false;
			}

		} while (loop);

		return childMarker;
	},

	/**
	 *
	 * @param _zoomLevel
	 * @returns {null}
	 */
	getParentClusterAtZoomLevel: function (_zoomLevel)
	{
		var parentMarker = null,
			loop = true,
			marker = this;

		do {
			marker = marker.__parent;
			if (marker._zoom === _zoomLevel && marker.childrenAreOnSamePosition())
			{
				parentMarker = marker;
				loop = false;
			}
			else if (marker._zoom < _zoomLevel || !marker.childrenAreOnSamePosition())
			{
				loop = false;
			}

		} while (loop);

		return parentMarker;
	}

});