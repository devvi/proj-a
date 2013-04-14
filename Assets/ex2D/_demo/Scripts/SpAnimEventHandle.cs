// ======================================================================================
// File         : SpAnimEventHandle.cs
// Author       : Wu Jie 
// Last Change  : 08/01/2011 | 15:42:02 PM | Monday,August
// Description  : 
// ======================================================================================

///////////////////////////////////////////////////////////////////////////////
// usings
///////////////////////////////////////////////////////////////////////////////

using UnityEngine;
using System.Collections;

///////////////////////////////////////////////////////////////////////////////
// defines
///////////////////////////////////////////////////////////////////////////////

public class SpAnimEventHandle : MonoBehaviour {

    public ParticleEmitter fx;

    void ShowEffect () {
        fx.Emit();
    }
}

