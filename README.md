# watsonc
WatsonC Vidi extension

## Python scripts

`profiletool.py` - generates plot description from profile

`python3.6 profiletool.py '{"coordinates": [[565977, 6372779], [567447, 6370030], [569000, 6369000]], "DGU_nr": ["  6.   37A", "  6.   37B", "  6.   64B", "  6.  413", "  6.   64A", "  6.  414", "  6.  835", "  6.  412", "  6.  783", "  6.  751", "  6.  931", "  6.  954", "  6.  955"], "Profile_depth": -80}'`

---

`intersectiontool.py` - detects what data sets are intersected by the profile, returns list of intersected profiles and stationing points

`python3.6 intersectiontool.py {"configFolder":"./data","coordinates":[[465474.01294827583,6306095.317335705],[464831.71249836613,6304949.984596321]],"DGU_nr":[" 29.   18"," 29.  365"," 29.  402"," 29.   42"],"Profile_depth":-100}`

---

`test.py` - runs tests for the `intersectiontool.py`

The `FOHM_layers_v2.npy` was not added to repo, please download it from https://s3-eu-west-1.amazonaws.com/mapcentia-tmp/ProfileTool.zip and put in `/extensions/watsonc/scripts` folder.